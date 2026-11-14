#!/usr/bin/env bash
#
# run-activation-tests.sh — integration tests for deploy/bin/ggitech-activate.
#
# ggitech-activate is the only command the `deploy` account may run as root, so
# its failure and rollback behaviour is the part of this deployment system most
# worth proving before it is installed. These tests exercise the real script,
# unmodified, in a private mount namespace where every hard-coded path it uses
# is backed by a temporary directory.
#
# Isolation strategy
# -----------------
# The script hard-codes /var/www/ggitech, /home/deploy/uploads, /var/log/ggitech,
# /run/ggitech-activate.lock and a pinned PATH of /usr/sbin:/usr/bin:/sbin:/bin.
# Rather than weaken the script with test-only overrides -- a root script whose
# base directory comes from the environment is exactly the vulnerability this
# design is meant to avoid -- the suite re-executes itself under
#
#     unshare --mount
#
# and bind-mounts temporary directories over those paths, and stub executables
# over /usr/bin/systemctl, /usr/bin/journalctl and /usr/bin/curl. It also
# bind-mounts private copies of the NSS databases so that the `ggitech` service
# account the script chowns to resolves, without an account ever being created on
# the host. The real filesystem is never written to, the real paths are never
# reached, and every mount is removed when the suite exits.
#
# Requirements
# ------------
#   * Linux. The script under test uses flock, GNU `find -printf`,
#     `realpath -m` and `realpath -e`, none of which exist on macOS or BSD.
#   * root (or a container with CAP_SYS_ADMIN so that unshare and mount work).
#   * util-linux (`unshare`, `flock`), coreutils (`timeout`, `stat`).
#
# The suite refuses to run on a host that already has a GGITECH installation,
# because bind-mounting over a live application tree is not something to do by
# accident.
#
# Usage
# -----
#   sudo deploy/tests/run-activation-tests.sh
#   sudo KEEP_TMP=1 deploy/tests/run-activation-tests.sh   # keep the sandbox
#   sudo ACTIVATOR=/path/to/ggitech-activate deploy/tests/run-activation-tests.sh
#
# Runtime is about five minutes: three scenarios deliberately wait out the
# activator's 60-second health-check timeout in order to prove the failure path.
#
# Scope
# -----
# Everything except the real systemd restart, the real Node process and the real
# nginx are covered here. `systemctl` and `curl` are stubs, so this suite proves
# the deployment state machine, not that the application actually boots. That
# distinction is recorded in deploy/README.md.
#
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly ACTIVATOR="${ACTIVATOR:-$SCRIPT_DIR/../bin/ggitech-activate}"

readonly APP_DIR=/var/www/ggitech
readonly RELEASES_DIR="$APP_DIR/releases"
readonly STATE_DIR="$APP_DIR/state"
readonly SHARED_DIR="$APP_DIR/shared"
readonly ENV_FILE="$SHARED_DIR/.env.production"
readonly UPLOAD_DIR=/home/deploy/uploads
readonly LOG_DIR=/var/log/ggitech
readonly LOCK_FILE=/run/ggitech-activate.lock

# Fixed release ids: the pattern the activator enforces is 40 lowercase hex.
readonly SHA_A=1111111111111111111111111111111111111111
readonly SHA_B=2222222222222222222222222222222222222222
readonly SHA_C=3333333333333333333333333333333333333333

# --------------------------------------------------------------------------
# Outer stage: validate the host and enter the private mount namespace.
# --------------------------------------------------------------------------
if [[ ${GGITECH_TEST_INSIDE:-} != 1 ]]; then
  if [[ $(uname -s) != Linux ]]; then
    printf 'this suite requires Linux (flock, GNU find -printf, realpath -m)\n' >&2
    exit 2
  fi

  if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
    printf 'this suite must run as root so it can create a mount namespace\n' >&2
    exit 2
  fi

  for required in unshare flock timeout stat; do
    if ! command -v "$required" >/dev/null 2>&1; then
      printf 'missing required command: %s\n' "$required" >&2
      exit 2
    fi
  done

  if [[ ! -f $ACTIVATOR ]]; then
    printf 'activator not found: %s\n' "$ACTIVATOR" >&2
    exit 2
  fi

  if [[ ! -x $ACTIVATOR ]]; then
    printf 'activator is not executable: %s\n' "$ACTIVATOR" >&2
    exit 2
  fi

  if [[ -e $APP_DIR || -e /usr/local/bin/ggitech-activate ]]; then
    printf 'refusing to run: this host already has a GGITECH installation (%s)\n' "$APP_DIR" >&2
    printf 'run this suite on a scratch VM or container instead.\n' >&2
    exit 2
  fi

  sandbox="$(mktemp -d /tmp/ggitech-activation-tests.XXXXXX)"
  GGITECH_TEST_INSIDE=1 GGITECH_TEST_TMP="$sandbox" \
    exec unshare --mount --propagation private -- "$0" "$@"
fi

readonly TMP="${GGITECH_TEST_TMP:?the sandbox path was not propagated}"
readonly FS="$TMP/fs"
readonly STUBS="$TMP/stubs"
readonly STATE="$TMP/stub-state"
readonly IDENTITY="$TMP/identity"
readonly ACTIVATOR_OUT="$TMP/activator.out"
readonly ACTIVATOR_ERR="$TMP/activator.err"

# Read by every stub. Exported, so the activator and the stubs inherit it.
STUB_STATE="$STATE"
export STUB_STATE

# --------------------------------------------------------------------------
# Reporting
# --------------------------------------------------------------------------
PASSED=0
FAILED=0
declare -a FAILURE_NOTES=()

pass() {
  PASSED=$((PASSED + 1))
  printf '  ok    %s\n' "$1"
}

fail() {
  FAILED=$((FAILED + 1))
  FAILURE_NOTES+=("$1")
  printf '  FAIL  %s\n' "$1"
}

scenario() {
  printf '\n== %s\n' "$1"
}

show_activator_output() {
  if [[ -s $ACTIVATOR_ERR ]]; then
    printf '        ---- activator stderr ----\n'
    sed 's/^/        | /' "$ACTIVATOR_ERR" | tail -n 40
  fi
}

# --------------------------------------------------------------------------
# Sandbox setup and teardown
# --------------------------------------------------------------------------
declare -a MOUNTS=()
declare -a CREATED_PATHS=()

mount_tmp() {
  umount -- "$1" 2>/dev/null || true
}

cleanup() {
  local rc=$?
  trap - EXIT

  umount -- "$LOCK_FILE" 2>/dev/null || true
  local index
  for ((index = ${#MOUNTS[@]} - 1; index >= 0; index--)); do
    mount_tmp "${MOUNTS[$index]}"
  done
  for ((index = ${#CREATED_PATHS[@]} - 1; index >= 0; index--)); do
    rmdir --ignore-fail-on-non-empty -p -- "${CREATED_PATHS[$index]}" 2>/dev/null || true
  done

  if [[ ${KEEP_TMP:-0} == 1 ]]; then
    printf '\nsandbox kept at %s\n' "$TMP"
  else
    rm -rf -- "$TMP"
  fi

  exit "$rc"
}
trap cleanup EXIT

ensure_created() {
  # Records a path this suite had to create on the (real) host, so it can be
  # removed again on the way out.
  if [[ ! -e $1 ]]; then
    CREATED_PATHS+=("$1")
  fi
}

bind_mount() {
  local source="$1"
  local target="$2"

  if [[ ! -e $target ]]; then
    ensure_created "$target"
    mkdir -p -- "$(dirname -- "$target")"
    if [[ -d $source ]]; then
      mkdir -p -- "$target"
    else
      : >"$target"
    fi
  fi

  mount --bind -- "$source" "$target"
  MOUNTS+=("$target")
}

write_stubs() {
  mkdir -p -- "$STUBS"

  cat >"$STUBS/systemctl" <<'STUB'
#!/bin/sh
# Test stub for systemctl. Behaviour is driven by files in $STUB_STATE.
state="${STUB_STATE:?}"
printf '%s\n' "$*" >>"$state/systemctl.calls"

case "$1" in
  restart)
    [ -f "$state/restart-fails" ] && exit 1
    exit 0
    ;;
  is-active)
    exit 0
    ;;
  status)
    echo "stub systemctl: ggitech.service (inactive; this is a test stub)"
    exit 0
    ;;
esac
exit 0
STUB

  cat >"$STUBS/journalctl" <<'STUB'
#!/bin/sh
echo "stub journalctl: no entries"
exit 0
STUB

  # A curl that answers /api/health, the homepage, static assets and the image
  # optimiser from files in $STUB_STATE. It models two things the activator
  # depends on: `-f` turning a non-2xx into exit 22, and `-o <file>` discarding
  # the body. The URL is whichever argument is not an option or an option value.
  cat >"$STUBS/curl" <<'STUB'
#!/bin/sh
state="${STUB_STATE:?}"

out=""
url=""
expect=""
for arg in "$@"; do
  if [ -n "$expect" ]; then
    if [ "$expect" = out ]; then out="$arg"; fi
    expect=""
    continue
  fi
  case "$arg" in
    -o | --output) expect=out ;;
    --max-time | --connect-timeout | -m | --retry) expect=skip ;;
    -*) : ;;
    *) url="$arg" ;;
  esac
done

respond() {
  if [ -z "$out" ]; then printf '%s\n' "$1"; fi
  exit "$2"
}

degraded='{"status":"degraded","release":null,"buildId":null,"uptimeSeconds":1,"timestamp":"1970-01-01T00:00:00.000Z"}'

case "$url" in
  */api/health)
    [ -f "$state/always-unhealthy" ] && respond "$degraded" 22
    if [ -f "$state/health-sha" ]; then
      sha="$(head -n 1 "$state/health-sha")"
      respond "{\"status\":\"ok\",\"release\":\"$sha\",\"buildId\":\"stubbuild\",\"uptimeSeconds\":1,\"timestamp\":\"1970-01-01T00:00:00.000Z\"}" 0
    fi
    respond "$degraded" 22
    ;;
  */_next/image*)
    [ -f "$state/image-fails" ] && respond "" 22
    respond "" 0
    ;;
  */_next/static/*)
    [ -f "$state/asset-fails" ] && respond "" 22
    respond "" 0
    ;;
esac

[ -f "$state/homepage-fails" ] && respond "" 22
respond '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/_next/static/chunks/stub.css"></head><body><main id="main"><h1>stub homepage</h1><img src="/_next/image?url=%2Flogo.png&amp;w=64&amp;q=75" alt=""></main><footer>https://ggitech.dev</footer></body></html>' 0
STUB

  chmod 0755 "$STUBS/systemctl" "$STUBS/journalctl" "$STUBS/curl"
}

# --------------------------------------------------------------------------
# The service identity
# --------------------------------------------------------------------------
# ggitech-activate hands the runtime cache to a hard-coded `ggitech:ggitech`, so
# that name has to resolve inside the sandbox or every activation dies at the
# first `chown` with "invalid user" -- an environment the real host never has,
# which makes the suite fail for a reason that has nothing to do with the script.
#
# Creating a real account is not an option: this suite must be safe to run on a
# machine whose accounts matter. Instead the identity is supplied by private
# copies of the NSS databases, bind-mounted over /etc/passwd, /etc/group and
# /etc/nsswitch.conf. The mounts live only in this suite's private mount
# namespace, so the host's accounts are not created, modified or deleted, and
# nothing outside the namespace can observe the fixture.

# The lowest free id at or above `preferred`. Reusing an id already present in
# the copy would make `stat -c %U` report the *other* name for it, and the
# ownership assertions would then be checking the wrong thing.
pick_free_id() {
  local file="$1"
  local preferred="$2"

  awk -F: -v preferred="$preferred" '
    $3 ~ /^[0-9]+$/ && $3 > highest { highest = $3 }
    $3 == preferred { taken = 1 }
    END { if (taken) print highest + 1; else print preferred }
  ' "$file"
}

write_identities() {
  mkdir -p -- "$IDENTITY"

  cp -- /etc/passwd "$IDENTITY/passwd"
  cp -- /etc/group "$IDENTITY/group"

  local uid gid
  uid="$(pick_free_id "$IDENTITY/passwd" 3213)"
  gid="$(pick_free_id "$IDENTITY/group" 3213)"

  printf '%s\n' \
    "ggitech:x:$uid:$gid:GGITECH service account (test fixture):$APP_DIR:/usr/sbin/nologin" \
    >>"$IDENTITY/passwd"
  printf '%s\n' "ggitech:x:$gid:ggitech" >>"$IDENTITY/group"

  # Resolution is pinned to the flat files. A host whose nsswitch consults a
  # network directory for passwd or group would otherwise resolve `ggitech`
  # somewhere else, or not at all.
  if [[ -f /etc/nsswitch.conf ]]; then
    awk '
      /^passwd:/ { print "passwd: files"; next }
      /^group:/ { print "group:  files"; next }
      { print }
    ' /etc/nsswitch.conf >"$IDENTITY/nsswitch.conf"
  else
    printf 'passwd: files\ngroup: files\n' >"$IDENTITY/nsswitch.conf"
  fi

  chmod 0644 "$IDENTITY/passwd" "$IDENTITY/group" "$IDENTITY/nsswitch.conf"
}

setup_sandbox() {
  mkdir -p -- \
    "$FS/app/releases" "$FS/app/state" "$FS/app/shared" \
    "$FS/uploads" "$FS/log" "$FS/lock" "$STATE"

  : >"$FS/lock/ggitech-activate.lock"
  : >"$FS/app/shared/.env.production"
  chmod 0640 "$FS/app/shared/.env.production"

  write_stubs
  write_identities

  bind_mount "$FS/app" "$APP_DIR"
  bind_mount "$FS/uploads" "$UPLOAD_DIR"
  bind_mount "$FS/log" "$LOG_DIR"

  # The service account the activator chowns to, supplied by the fixture above.
  bind_mount "$IDENTITY/passwd" /etc/passwd
  bind_mount "$IDENTITY/group" /etc/group
  bind_mount "$IDENTITY/nsswitch.conf" /etc/nsswitch.conf

  # The lock file is mounted individually so the real /run is left alone.
  if [[ ! -e $LOCK_FILE ]]; then
    ensure_created "$LOCK_FILE"
    : >"$LOCK_FILE"
  fi
  mount --bind -- "$FS/lock/ggitech-activate.lock" "$LOCK_FILE"
  MOUNTS+=("$LOCK_FILE")

  # Stubs replace the real binaries inside this namespace only.
  :
  local name
  for name in systemctl journalctl curl; do
    if [[ ! -e /usr/bin/$name ]]; then
      ensure_created "/usr/bin/$name"
      : >"/usr/bin/$name"
    fi
    mount --bind -- "$STUBS/$name" "/usr/bin/$name"
    MOUNTS+=("/usr/bin/$name")
  done
}

# --------------------------------------------------------------------------
# Fixtures
# --------------------------------------------------------------------------
make_release() {
  # A tree that satisfies every check the activator performs.
  local sha="$1"
  local dir="$2"

  rm -rf -- "$dir"
  mkdir -p -- "$dir/.next/static/chunks" "$dir/public"

  printf '// stub server\n' >"$dir/server.js"
  printf '{"name":"ggitech-stub","version":"0.0.0"}\n' >"$dir/package.json"
  printf 'stubbuild\n' >"$dir/.next/BUILD_ID"
  printf 'html{color:#000}\n' >"$dir/.next/static/chunks/stub.css"
  printf 'stub image\n' >"$dir/public/logo.png"
  printf '%s\n' "$sha" >"$dir/RELEASE_SHA"
}

stage_upload() {
  make_release "$1" "$UPLOAD_DIR/$1"
}

reset_environment() {
  # ${var:?} rather than a bare "$var": this function deletes recursively, and an
  # empty variable would turn the glob into /* and wipe the host.
  rm -f -- "$APP_DIR/current" "$APP_DIR/current.new"
  rm -rf -- "${RELEASES_DIR:?}"/* 2>/dev/null || true
  rm -rf -- "${RELEASES_DIR:?}"/.incoming-* 2>/dev/null || true
  rm -rf -- "${STATE_DIR:?}"/* 2>/dev/null || true
  rm -rf -- "${UPLOAD_DIR:?}"/* 2>/dev/null || true
  rm -f -- "${STATE:?}"/*
  rm -f -- "$LOG_DIR/deploy.log"

  mkdir -p -- "$RELEASES_DIR" "$STATE_DIR" "$UPLOAD_DIR" "$SHARED_DIR"
  : >"$ENV_FILE"
  chmod 0640 "$ENV_FILE"
}

# --------------------------------------------------------------------------
# Assertions
# --------------------------------------------------------------------------
LAST_RC=127

run_activator() {
  set +e
  # A hang must fail the suite rather than block it forever. The budget has to
  # clear HEALTH_TIMEOUT_SECONDS (60) twice over: scenario 5 waits out a full
  # health-check timeout on the release that fails, and then a second one on
  # the rollback that also fails, so 90 seconds would kill a legitimate run.
  timeout 300 "$ACTIVATOR" "$@" >"$ACTIVATOR_OUT" 2>"$ACTIVATOR_ERR"
  LAST_RC=$?
  set -e
}

expect_rc() {
  if [[ $LAST_RC -eq $1 ]]; then
    pass "$2 (exit $LAST_RC)"
  else
    fail "$2: expected exit $1, got $LAST_RC"
    show_activator_output
  fi
  return 0
}

assert_current_is() {
  local want="$RELEASES_DIR/$1"
  local got
  got="$(readlink -f -- "$APP_DIR/current" 2>/dev/null || true)"
  if [[ $got == "$want" ]]; then
    pass "$2"
  else
    fail "$2: current -> ${got:-<none>}, expected $want"
  fi
}

assert_current_absent() {
  if [[ -e $APP_DIR/current || -L $APP_DIR/current ]]; then
    fail "$1: current exists but should not"
  else
    pass "$1"
  fi
}

assert_state() {
  local got
  got="$(cat -- "$STATE_DIR/$1" 2>/dev/null || true)"
  if [[ $got == "$2" ]]; then
    pass "$3"
  else
    fail "$3: state/$1 is '${got:-<empty>}', expected '$2'"
  fi
}

assert_state_empty() {
  local got
  got="$(cat -- "$STATE_DIR/$1" 2>/dev/null || true)"
  if [[ -z $got ]]; then
    pass "$2"
  else
    fail "$2: state/$1 is '$got', expected empty"
  fi
}

assert_absent() {
  if [[ -e $1 || -L $1 ]]; then
    fail "$2: $1 still exists"
  else
    pass "$2"
  fi
}

assert_owner() {
  local got
  got="$(stat -c '%U:%G' "$1" 2>/dev/null || echo '<missing>')"
  if [[ $got == "$2" ]]; then
    pass "$3"
  else
    fail "$3: $1 is owned by $got, expected $2"
  fi
}

assert_mode() {
  local got
  got="$(stat -c '%a' "$1" 2>/dev/null || echo '<missing>')"
  if [[ $got == "$2" ]]; then
    pass "$3"
  else
    fail "$3: $1 has mode $got, expected $2"
  fi
}

assert_not_writable_by_service() {
  # Group and other must have no write bit anywhere in the release code.
  local found
  found="$(find "$1" -perm /022 -print -quit 2>/dev/null || true)"
  if [[ -z $found ]]; then
    pass "$2"
  else
    fail "$2: $found is writable by group or other"
  fi
}

assert_stdout_contains() {
  if grep -q -- "$1" "$ACTIVATOR_OUT"; then
    pass "$2"
  else
    fail "$2: '$1' not found in the activators --status output"
    sed 's/^/        | /' "$ACTIVATOR_OUT" | head -n 20
  fi
}

assert_log_contains() {
  if grep -q -- "$1" "$ACTIVATOR_ERR"; then
    pass "$2"
  else
    fail "$2: '$1' not found in the activator output"
  fi
}

# --------------------------------------------------------------------------
# Scenarios
# --------------------------------------------------------------------------
scenario_1_successful_first_deployment() {
  scenario "1. Successful first deployment"
  reset_environment
  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"

  run_activator "$SHA_A"
  expect_rc 0 "a valid first release activates"
  assert_current_is "$SHA_A" "current points at the first release"
  assert_state active "$SHA_A" "the release is recorded as active"
  assert_state_empty previous "no rollback target is recorded for a first deployment"
  assert_absent "$RELEASES_DIR/.incoming-$SHA_A" "the staging directory was consumed"
  assert_absent "$UPLOAD_DIR/$SHA_A" "the upload directory was consumed"

  assert_owner "$RELEASES_DIR/$SHA_A/server.js" "root:root" "release code is root-owned"
  assert_not_writable_by_service "$RELEASES_DIR/$SHA_A" "release code is not writable by the service account"
  assert_owner "$RELEASES_DIR/$SHA_A/.next/cache" "ggitech:ggitech" "the runtime cache is handed to the service account"
  assert_mode "$RELEASES_DIR/$SHA_A/.next/cache" 750 "the runtime cache is 0750"
}

scenario_2_failed_first_deployment() {
  scenario "2. Failed first deployment with no previous release"
  reset_environment
  stage_upload "$SHA_A"
  # No health-sha file: nothing ever reports healthy, so the health check runs
  # to its 60-second timeout and there is no previous release to fall back to.
  rm -f -- "$STATE/health-sha"

  run_activator "$SHA_A"
  expect_rc 8 "a first release that never becomes healthy exits 8"
  assert_state_empty active "no release is recorded as verified"
  assert_current_is "$SHA_A" "the unverified release is left in place for inspection"
  assert_absent "$UPLOAD_DIR/$SHA_A" "the upload directory was still consumed"

  run_activator --status
  expect_rc 0 "--status remains available after a failed deployment"
  assert_stdout_contains '^verified=no$' "the host reports that no release is verified"
}

scenario_3_successful_upgrade() {
  scenario "3. Successful upgrade"
  reset_environment

  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"
  run_activator "$SHA_A"
  expect_rc 0 "the first release activates"

  stage_upload "$SHA_B"
  printf '%s\n' "$SHA_B" >"$STATE/health-sha"
  run_activator "$SHA_B"
  expect_rc 0 "the upgrade activates"
  assert_current_is "$SHA_B" "current points at the upgraded release"
  assert_state active "$SHA_B" "the upgraded release is recorded as active"
  assert_state previous "$SHA_A" "the replaced release becomes the rollback target"
  # The replaced release is deliberately kept: it is the target a rollback would
  # restore, so pruning it here would make the next rollback impossible.
  assert_owner "$RELEASES_DIR/$SHA_A" "root:root" \
    "the replaced release is retained on disk while it is the rollback target"
}

scenario_4_failed_upgrade_then_rollback() {
  scenario "4. Failed upgrade followed by a successful rollback"
  reset_environment

  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"
  run_activator "$SHA_A"
  expect_rc 0 "the first release activates"

  # The new release never reports its own SHA, so activation fails while the
  # previously verified release keeps reporting healthy.
  stage_upload "$SHA_B"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"

  run_activator "$SHA_B"
  expect_rc 6 "a failed upgrade that recovers exits 6"
  assert_current_is "$SHA_A" "current is restored to the previous release"
  assert_state active "$SHA_A" "the restored release remains the verified release"
  assert_state_empty previous "the failed upgrade does not poison the rollback target"

  run_activator --status
  expect_rc 0 "--status works after a recovered failure"
  assert_stdout_contains '^verified=yes$' "the host reports a verified release is live"
}

scenario_5_failed_rollback() {
  scenario "5. Failed rollback, then manual recovery once the fault is removed"
  reset_environment

  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"
  run_activator "$SHA_A"
  expect_rc 0 "the first release activates"

  # Nothing reports healthy at all, so the new release fails and the rollback
  # that follows cannot be verified either.
  stage_upload "$SHA_B"
  : >"$STATE/always-unhealthy"

  run_activator "$SHA_B"
  expect_rc 7 "an unrecoverable failure exits 7 rather than claiming recovery"
  assert_state active "$SHA_A" "the failed activation did not overwrite the verified release record"

  run_activator --status
  expect_rc 0 "--status still works while the site is unhealthy"
  # The rollback put the symlink back on the last release that completed an
  # activation, and that record was never overwritten by the failed attempt, so
  # the host reports SHA_A and not SHA_B. `verified` reports the recorded state
  # rather than probing the service -- the workflow's recovery step does the
  # independent health check, and refuses to claim recovery from this alone.
  assert_stdout_contains "^active=$SHA_A$" "the failed release was never recorded as active"
  assert_stdout_contains '^verified=yes$' "the host still reports its last verified release"

  run_activator --rollback
  expect_rc 8 "a rollback that cannot be verified reports failure instead of success"
  assert_log_contains 'ROLLBACK FAILED' "the failure is logged explicitly"

  rm -f -- "$STATE/always-unhealthy"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"
  run_activator --rollback
  expect_rc 0 "the same rollback succeeds once the underlying fault is gone"
  assert_current_is "$SHA_A" "current points at the known-good release"
  assert_state active "$SHA_A" "the known-good release is recorded as active"
}

scenario_6_interrupted_activation() {
  scenario "6. Interrupted activation is repaired by --rollback"
  reset_environment

  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"
  run_activator "$SHA_A"
  expect_rc 0 "the first release activates"

  # Exactly the state an activation killed between the symlink swap and the
  # state write leaves behind: current has moved, active has not.
  make_release "$SHA_B" "$RELEASES_DIR/$SHA_B"
  ln -sfn -- "$RELEASES_DIR/$SHA_B" "$APP_DIR/current.new"
  mv -T -- "$APP_DIR/current.new" "$APP_DIR/current"

  run_activator --status
  expect_rc 0 "--status reads the interrupted state"
  assert_stdout_contains '^verified=no$' "the interrupted state is reported as unverified"

  run_activator --rollback
  expect_rc 0 "--rollback repairs the interrupted activation"
  assert_current_is "$SHA_A" "current is repointed at the last verified release"
  assert_state active "$SHA_A" "the verified release is recorded as active"

  run_activator --status
  expect_rc 0 "--status works after the repair"
  assert_stdout_contains '^verified=yes$' "the repaired host reports a verified release"
}

scenario_7_repeated_activation() {
  scenario "7. Repeated activation of the same commit"
  reset_environment

  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"
  run_activator "$SHA_A"
  expect_rc 0 "the first activation succeeds"

  stage_upload "$SHA_A"
  run_activator "$SHA_A"
  expect_rc 0 "re-activating the same commit succeeds and re-verifies it"
  assert_current_is "$SHA_A" "current still points at the same release"
  assert_state active "$SHA_A" "the release is still recorded as active"
  assert_state_empty previous "a re-deploy does not make the release its own rollback target"
  assert_absent "$RELEASES_DIR/.incoming-$SHA_A" "the re-uploaded staging directory was consumed"
  assert_log_contains 'already the live release' "the re-deploy is reported rather than silently repeated"
}

scenario_8_manual_rollback() {
  scenario "8. Manual rollback to a known-good release"
  reset_environment

  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"
  run_activator "$SHA_A"
  expect_rc 0 "the first release activates"

  stage_upload "$SHA_B"
  printf '%s\n' "$SHA_B" >"$STATE/health-sha"
  run_activator "$SHA_B"
  expect_rc 0 "the upgrade activates"

  run_activator --rollback
  expect_rc 0 "--rollback restores the known-good release"
  assert_current_is "$SHA_A" "current points at the restored release"
  assert_state active "$SHA_A" "the restored release is recorded as active"

  run_activator --status
  expect_rc 0 "--status works after a manual rollback"
  assert_stdout_contains '^verified=yes$' "the host reports a verified release"
}

scenario_9_malformed_artifacts() {
  scenario "9. Missing, malformed and malicious artifacts"

  reset_environment
  run_activator "$SHA_A"
  expect_rc 3 "a release with no uploaded or staged artifact is refused"
  assert_current_absent "current was not created"

  # Incomplete artifact.
  reset_environment
  stage_upload "$SHA_A"
  rm -f -- "$UPLOAD_DIR/$SHA_A/server.js"
  run_activator "$SHA_A"
  expect_rc 4 "an artifact missing server.js is refused"
  assert_absent "$RELEASES_DIR/.incoming-$SHA_A" "the rejected staging directory is removed"
  assert_absent "$RELEASES_DIR/$SHA_A" "the rejected artifact is not promoted"

  # Wrong identity.
  reset_environment
  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_C" >"$UPLOAD_DIR/$SHA_A/RELEASE_SHA"
  run_activator "$SHA_A"
  expect_rc 4 "an artifact that declares a different SHA is refused"
  assert_absent "$RELEASES_DIR/$SHA_A" "the mislabelled artifact is not promoted"

  # Empty BUILD_ID.
  reset_environment
  stage_upload "$SHA_A"
  : >"$UPLOAD_DIR/$SHA_A/.next/BUILD_ID"
  run_activator "$SHA_A"
  expect_rc 4 "an artifact with an empty BUILD_ID is refused"

  # Absolute symlink.
  reset_environment
  stage_upload "$SHA_A"
  ln -s -- /etc/passwd "$UPLOAD_DIR/$SHA_A/escape"
  run_activator "$SHA_A"
  expect_rc 4 "an artifact containing an absolute symlink is refused"

  # Escaping relative symlink.
  reset_environment
  stage_upload "$SHA_A"
  ln -s -- ../../../../etc/passwd "$UPLOAD_DIR/$SHA_A/.next/escape"
  run_activator "$SHA_A"
  expect_rc 4 "an artifact containing an escaping relative symlink is refused"

  # Special file.
  reset_environment
  stage_upload "$SHA_A"
  mkfifo -- "$UPLOAD_DIR/$SHA_A/pipe"
  run_activator "$SHA_A"
  expect_rc 4 "an artifact containing a FIFO is refused"

  # setuid bit.
  reset_environment
  stage_upload "$SHA_A"
  chmod 4755 "$UPLOAD_DIR/$SHA_A/server.js"
  run_activator "$SHA_A"
  expect_rc 4 "an artifact containing a setuid file is refused"

  # Malformed release id.
  reset_environment
  run_activator "not-a-sha"
  expect_rc 2 "a malformed release id is rejected"

  run_activator "../../etc"
  expect_rc 2 "a path traversal attempt in the release id is rejected"

  run_activator ""
  expect_rc 2 "an empty release id is rejected"

  # Argument handling.
  reset_environment
  run_activator
  expect_rc 2 "no arguments is a usage error"

  run_activator "$SHA_A" "extra"
  expect_rc 2 "an unexpected extra argument is rejected"

  run_activator "$SHA_A" "$SHA_B"
  expect_rc 2 "two release ids are rejected"

  run_activator --nope
  expect_rc 2 "an unknown option is rejected"

  # A symlinked upload path must not be followed.
  reset_environment
  mkdir -p -- "$TMP/elsewhere"
  make_release "$SHA_A" "$TMP/elsewhere/$SHA_A"
  ln -s -- "$TMP/elsewhere/$SHA_A" "$UPLOAD_DIR/$SHA_A"
  run_activator "$SHA_A"
  expect_rc 3 "a symlinked upload path is refused"
}

scenario_10_concurrency() {
  scenario "10. Concurrent activation is refused"
  reset_environment
  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"

  exec 8>"$LOCK_FILE"
  flock -n 8

  run_activator "$SHA_A"
  expect_rc 5 "a second activation is refused while the lock is held"
  assert_current_absent "the refused activation changed nothing"

  run_activator --status
  expect_rc 0 "--status is served without taking the lock"

  flock -u 8
  exec 8>&-

  run_activator "$SHA_A"
  expect_rc 0 "the same activation succeeds once the lock is released"
}

scenario_11_preparation_failure() {
  scenario "11. A release that cannot be prepared is refused before the swap"
  reset_environment

  # Root ignores permission bits, so a mode change cannot be made to fail as
  # root. A regular file where the runtime cache directory has to go can: `mkdir
  # -p` refuses to replace it, which is the same code path as a full disk or a
  # service account that is missing. Everything before preparation still passes,
  # so this is specifically the preparation failure.
  stage_upload "$SHA_A"
  printf 'not a directory\n' >"$UPLOAD_DIR/$SHA_A/.next/cache"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"

  run_activator "$SHA_A"
  expect_rc 4 "a first release that cannot be prepared is refused"
  assert_current_absent "the un-preparable release is never pointed at"
  assert_state_empty active "no release is recorded as verified"
  assert_log_contains 'could not create the runtime cache directory' \
    "the failing step is named in the log"

  # The same failure during an upgrade: nothing has been swapped at this point,
  # so the live release must keep serving and no rollback is attempted.
  reset_environment
  stage_upload "$SHA_A"
  printf '%s\n' "$SHA_A" >"$STATE/health-sha"
  run_activator "$SHA_A"
  expect_rc 0 "a good release activates"

  stage_upload "$SHA_B"
  printf 'not a directory\n' >"$UPLOAD_DIR/$SHA_B/.next/cache"
  run_activator "$SHA_B"
  expect_rc 4 "an upgrade that cannot be prepared is refused"
  assert_current_is "$SHA_A" "current still points at the live release"
  assert_state active "$SHA_A" "the live release is still the verified release"
  assert_state_empty previous "the refused upgrade records no rollback target"

  run_activator --status
  expect_rc 0 "--status still answers after a refused preparation"
  assert_stdout_contains '^verified=yes$' "the live site is still reported as verified"
}

# --------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------
setup_sandbox
printf 'ggitech-activate integration tests\n'
printf 'activator : %s\n' "$ACTIVATOR"
printf 'sandbox   : %s\n' "$TMP"

scenario_1_successful_first_deployment
scenario_2_failed_first_deployment
scenario_3_successful_upgrade
scenario_4_failed_upgrade_then_rollback
scenario_5_failed_rollback
scenario_6_interrupted_activation
scenario_7_repeated_activation
scenario_8_manual_rollback
scenario_9_malformed_artifacts
scenario_10_concurrency
scenario_11_preparation_failure

printf '\n----------------------------------------\n'
printf 'passed: %d\n' "$PASSED"
printf 'failed: %d\n' "$FAILED"

if ((FAILED > 0)); then
  printf '\nfailures:\n'
  for note in "${FAILURE_NOTES[@]}"; do
    printf '  - %s\n' "$note"
  done
  exit 1
fi

printf '\nall activation scenarios behaved as documented\n'
