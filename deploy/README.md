# GGITECH production deployment

Everything needed to run `https://ggitech.dev` on the DigitalOcean host, and to
deploy to it from GitHub Actions without a human logging in.

This host also runs the **Bells University certificate verification portal** on
port 3100. Nothing in this directory touches that application: it has its own
systemd unit, its own nginx `server` block and its own database. The single
shared resource is the nginx process itself, and adding a vhost to it is a
graceful reload.

## This installs over a server that is already working

GGITECH is already installed on that host, so every step below is written to be
idempotent and **non-destructive**. The facts this runbook is written against:

| Fact | Value |
| --- | --- |
| OS | Ubuntu 24.04, 1 vCPU / 2 GB RAM / 2 GB swap |
| Hostname | `ggitech` |
| Administrator | `admin` |
| Application account | `ggitech` |
| Deployment account | `deploy` |
| Node.js | 22 |
| Application port | `3213` (loopback only) |
| HTTPS | already working for `ggitech.dev` |
| Let's Encrypt HTTP-01 webroot | `/var/www/ggitech-acme` |
| Existing nginx vhost | `/etc/nginx/sites-available/ggitech` → `sites-enabled/ggitech` |
| Environment file | `/var/www/ggitech/shared/.env.production` (already exists) |
| Application directories | already exist |
| systemd unit | registered, **not started** |
| Other services | Bells portal on 3100, MySQL |

The rules that follow from that:

- **An existing file is never overwritten to "create" it.** If it is already
  there, it is left exactly as it is and only reported on.
- **A file that must be replaced is backed up first**, and the backup is
  restored if `nginx -t` or `systemd-analyze verify` rejects the replacement.
- **Permissions are changed in place** (`chown`/`chmod` on the existing file),
  never by deleting and recreating it.
- **The Bells University configuration and its certificate are never edited.**
- Every step is safe to run twice.

---

## Contents

| Path | What it is |
| --- | --- |
| `.github/workflows/deploy-production.yml` | Validate, build, transfer, activate, verify, recover |
| `.github/workflows/ci.yml` | Formatting, lint, typecheck, build, dependency audit on every PR |
| `app/api/health/route.ts` | Readiness endpoint the pipeline and the activator poll |
| `deploy/bin/ggitech-activate` | Root-owned activation script — the only privileged command `deploy` may run |
| `deploy/sudoers/ggitech-activate` | The single sudoers rule that grants it |
| `deploy/systemd/ggitech.service` | The application service |
| `deploy/nginx/ggitech.conf` | Reverse proxy for `ggitech.dev` |
| `deploy/tests/run-activation-tests.sh` | Linux-only integration tests for the activation and rollback state machine |

---

## How a deployment works

```
git push origin main
  │
  ├─ quality job      npm ci · format:check · lint · typecheck · build
  │                   assemble .next/standalone + .next/static + public
  │                   tar it, upload as a workflow artifact
  ├─ audit job        npm audit --omit=dev --audit-level=high
  │
  └─ deploy job  (needs both, environment: production, concurrency: production-deploy)
       ├─ guard      SHA is 40 lowercase hex; ref is refs/heads/main
       ├─ ssh        pinned host key   →  ssh ggitech-production
       ├─ status     report the release that is live now
       ├─ stale?     refuse a commit that is an ancestor of the live release
       ├─ transfer   rsync → deploy@host:/home/deploy/uploads/<sha>
       ├─ activate   sudo ggitech-activate <sha>
       │               stage upload → validate → promote → swap symlink
       │               → restart service → poll /api/health for <sha>
       │               → smoke-test the homepage → prune → record state
       │               on any failure: roll back internally, exit 6, 7 or 8
       ├─ recover    only after a failed activation: `--status` first, then a
       │             `--rollback` only if no verified release is live, and an
       │             independent health check that refuses to report success
       │             unless a release really is serving
       └─ always     discard an incomplete upload, report final state, delete the key
```

The build happens **once**. The exact tarball that passed validation is the one
that is deployed; the deploy job never rebuilds.

### What the exit codes mean

`ggitech-activate` reports a different code for each genuinely different
outcome, and the workflow turns each into its own log message, so a failed run
says *which* thing failed instead of only "deployment failed".

| Code | Meaning | What happens next |
| --- | --- | --- |
| `0` | The release is live and passed the health check and the smoke test | Done |
| `1` | Preflight/environment failure (not root, a required directory missing) | An installation step was skipped or reverted — see below |
| `2` | Bad usage or a malformed release id | A caller bug, not a server problem |
| `3` | Release missing, or a path that escapes `releases/` | The transfer or the promotion failed |
| `4` | Release content failed validation | The artifact was rejected and deleted |
| `5` | Another activation holds the lock | Wait; `/run` is tmpfs, a reboot clears it |
| `6` | Activation failed, **but the previous release was restored and is healthy** | Production is serving the previous release |
| `7` | Activation failed **and the rollback did not restore service** | Needs a human; the workflow's recovery step tries, then verifies |
| `8` | Activation failed and **there was no verified release to fall back to** | A failed first deployment — needs a human |

The workflow's recovery step never treats exit `6`/`7`/`8` as reason enough to
move on: it re-reads `--status`, only issues a `--rollback` when no verified
release is live, and then checks `/api/health` itself. If nothing is serving,
the run fails with `RECOVERY UNVERIFIED` and does not claim a recovery.

### Releases on disk

```
/var/www/ggitech/
├── current -> releases/<sha>        # symlink, swapped with rename(2)
├── releases/
│   ├── <sha>/                       # one directory per deployed commit
│   └── .incoming-<sha>/             # staging; dot-prefixed so a half-written
│                                    # upload can never be mistaken for a release
├── shared/.env.production           # secrets — outside every release
└── state/
    ├── active                       # last release that passed activation
    └── previous                     # the release live before it

/home/deploy/uploads/                # the deployment account's inbound directory
/var/log/ggitech/deploy.log          # every activation, root-owned, 0640
/run/ggitech-activate.lock           # flock target; tmpfs, so cleared on reboot
```

Five releases are retained, and `active` and `previous` are never pruned, so a
rollback target always exists.

---

## Installing on the existing server

Run all of this as `admin` (or any sudo-capable account) — never as `deploy`.
Run it from a checkout of this repository on the server, or copy the files
across first.

Steps 1–7 are ordered and each one is safe to re-run. Nothing here deletes a
directory, truncates a file or reissues a certificate.

> **Do not start the service yet.** The unit's
> `WorkingDirectory=/var/www/ggitech/current` does not resolve until the first
> successful activation, so `systemctl start` before then fails. The first
> deployment starts it.

### 1. Application tree

These directories already exist; `install -d` creates only what is missing and
otherwise just sets the mode and owner of the directory that is there. It never
removes contents.

```bash
sudo ls -ld /var/www/ggitech /var/www/ggitech/releases /var/www/ggitech/state \
            /var/www/ggitech/shared /var/log/ggitech 2>/dev/null

sudo install -d -o root -g root    -m 0755 /var/www/ggitech
sudo install -d -o root -g root    -m 0755 /var/www/ggitech/releases
sudo install -d -o root -g root    -m 0755 /var/www/ggitech/state
sudo install -d -o root -g ggitech -m 0750 /var/www/ggitech/shared
sudo install -d -o root -g root    -m 0750 /var/log/ggitech
```

`/var/www/ggitech` and `/var/www/ggitech/releases` must be real directories, not
symlinks — the activation script refuses to run otherwise.

### 2. Production secrets

**The credentials file already exists on this host and must not be truncated.**
The `if` guard is the whole point of this step: `install /dev/null <file>` would
empty a working SMTP configuration, and the application would only fail later,
when a visitor submitted the form.

```bash
ENV_FILE=/var/www/ggitech/shared/.env.production

if [[ -e $ENV_FILE ]]; then
  echo "$ENV_FILE already exists — contents left untouched"
else
  sudo install -o root -g ggitech -m 0640 /dev/null "$ENV_FILE"
fi

# Non-destructive: correct the mode and owner of the file that is there.
sudo chown root:ggitech "$ENV_FILE"
sudo chmod 0640 "$ENV_FILE"

# Which keys are present — names only, never values.
sudo grep -oE '^[A-Z_]+=' "$ENV_FILE" | sort
```

The SMTP password lives only in this file, on this server. It is never copied
into a release, never read by the workflow and never printed. That is also why a
rollback cannot resurrect a stale credential set.

Required contents:

```dotenv
# Mail. Server-only: the workflow never sees these.
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=
OFFICIAL_BRIEF_EMAIL=

# Baked into the build by the workflow; kept here so that server-rendered
# origin checks agree with what was compiled in.
NEXT_PUBLIC_SITE_URL=https://ggitech.dev

NEXT_PUBLIC_ENABLE_3D=false

# Optional. Without these, rate-limit counters live in the process and reset on
# every deploy. The service runs a single process, so the in-process fallback is
# correct but not durable across releases.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# nginx is the only proxy in front of the app, so exactly one hop is trusted.
# Set this to 0 only if Node is ever exposed directly, which it is not.
TRUSTED_PROXY_HOPS=1
```

Edit the values with `sudoedit "$ENV_FILE"`, which edits a temporary copy and
writes it back — never with a command that regenerates the whole file.

Do **not** add `PORT`, `HOSTNAME` or `NODE_ENV` here — the unit sets all three,
and `Environment=` deliberately overrides `EnvironmentFile=`.

### 3. The activation script

```bash
sudo install -o root -g root -m 0755 deploy/bin/ggitech-activate /usr/local/bin/ggitech-activate
sudo bash -n /usr/local/bin/ggitech-activate     # syntax check, no output = ok
```

Root-owned and not writable by `deploy`. This matters: it is the only thing
standing between a leaked deployment key and the host.

### 4. The restricted sudoers rule

```bash
sudo install -o root -g root -m 0440 deploy/sudoers/ggitech-activate /etc/sudoers.d/ggitech-activate
sudo visudo -c
sudo -l -U deploy
```

`sudo -l -U deploy` must list **exactly one** command and no `ALL`:

```
(ALL) NOPASSWD: /usr/local/bin/ggitech-activate
```

There is no wildcard, no `bash`, no `systemctl` and no general-purpose
executor. If a future workflow needs another privileged operation, write a
purpose-built command for it and add one more narrow rule — do not widen this
one.

### 5. The application service

A `ggitech.service` unit is **already registered** on this host and is not
started. Do not overwrite it blind: back it up, show the difference, replace it,
and put the previous unit back if the replacement does not validate.

```bash
UNIT=/etc/systemd/system/ggitech.service
ts=$(date +%Y%m%d%H%M%S)

if [[ -e $UNIT ]]; then
  sudo cp -a "$UNIT" "$UNIT.bak.$ts"
  echo "previous unit saved as $UNIT.bak.$ts"
  sudo diff -u "$UNIT" deploy/systemd/ggitech.service || true
fi

sudo install -o root -g root -m 0644 deploy/systemd/ggitech.service "$UNIT"

if ! sudo systemd-analyze verify "$UNIT"; then
  echo "the replacement unit does not validate; restoring the previous one"
  if [[ -e $UNIT.bak.$ts ]]; then
    sudo cp -a "$UNIT.bak.$ts" "$UNIT"
  else
    sudo rm -f "$UNIT"
  fi
  exit 1
fi

sudo systemctl daemon-reload
sudo systemctl enable ggitech.service
```

`enable` only wires the unit into the boot targets. **Do not start it** — the
first deployment does, once a release exists for `current` to point at.

### 6. The reverse proxy

This is the step where it is easiest to break a working server, because
`ggitech.dev` is **already served** by a vhost that has no `.conf` suffix:

```
/etc/nginx/sites-available/ggitech   →  /etc/nginx/sites-enabled/ggitech
```

Install the new configuration **over that file**. Do not add a second one called
`ggitech.conf`: two enabled `server` blocks with the same `server_name` leave
nginx using whichever it reads first, which is a silent, confusing
misconfiguration rather than an error.

Nothing in this step touches the Bells University vhost, its port 3100 upstream
or its certificate.

Check the certificate and the renewal mechanism first. The vhost assumes the
lineage `ggitech.dev`, and the ACME location assumes the `--webroot` path
`/var/www/ggitech-acme`:

```bash
sudo ls -1 /etc/letsencrypt/live/
sudo grep -H -E 'authenticator|webroot_path' /etc/letsencrypt/renewal/*.conf
```

If the lineage name differs, edit **only** the two `ssl_certificate` lines in
`deploy/nginx/ggitech.conf` before installing it. If `authenticator` is `nginx`
rather than `webroot`, the renewal does not use the ACME location at all —
leaving the block in place is still correct, and both mechanisms coexist. Never
reissue the certificate.

```bash
SITE=/etc/nginx/sites-available/ggitech
ts=$(date +%Y%m%d%H%M%S)

# 1. Look at what is enabled before changing anything.
sudo ls -l /etc/nginx/sites-enabled/
sudo grep -rn 'server_name' /etc/nginx/sites-enabled/ 2>/dev/null

# 2. Remove a conflicting GGITECH duplicate if one exists — but only after
#    confirming it really is a GGITECH vhost. A file that does not mention
#    ggitech.dev is left alone and the step stops.
for dup in /etc/nginx/sites-enabled/ggitech.conf /etc/nginx/sites-available/ggitech.conf; do
  if sudo test -e "$dup"; then
    if sudo grep -q 'ggitech\.dev' "$dup"; then
      sudo rm -f "$dup"
      echo "removed conflicting duplicate: $dup"
    else
      echo "refusing to remove $dup: it does not look like a GGITECH vhost"
      exit 1
    fi
  fi
done

# 3. Back up the live GGITECH vhost, then replace it in place.
sudo cp -a "$SITE" "$SITE.bak.$ts"
sudo install -o root -g root -m 0644 deploy/nginx/ggitech.conf "$SITE"
sudo ln -sfn "$SITE" /etc/nginx/sites-enabled/ggitech

# 4. Validate the WHOLE configuration before reloading anything.
if ! sudo nginx -t; then
  echo "nginx -t rejected the new vhost; restoring the previous configuration"
  sudo cp -a "$SITE.bak.$ts" "$SITE"
  sudo nginx -t
  exit 1
fi

sudo systemctl reload nginx
```

`nginx -t` parses every enabled vhost, including the portal's, so a mistake here
is caught before anything is reloaded. `reload` is graceful: in-flight
connections, including the portal's, are served by the old workers until they
finish.

The old configuration is still at `$SITE.bak.<timestamp>` afterwards. Keep it
until the first production deployment has succeeded, then remove it.

### 7. The upload directory

```bash
sudo install -d -o deploy -g deploy -m 0700 /home/deploy/uploads
```

The existing SSH connection test asserts this directory exists, and the
workflow uploads into it. It is the only path outside `/var/www/ggitech` that
the activation script reads from, and it is never read before the upload is
re-owned and re-validated.

### 8. Verify before the first deploy

Everything here is read-only. Run it after steps 1–7 and before enabling the
first deployment.

```bash
sudo visudo -c                                          # sudoers parses
sudo -l -U deploy                                       # exactly one command
sudo systemd-analyze verify /etc/systemd/system/ggitech.service
sudo nginx -t                                           # every vhost parses
sudo -u deploy ssh -o BatchMode=yes localhost true      # deploy can SSH out (not required)
sudo systemctl is-enabled ggitech.service                # enabled, not running
sudo systemctl is-active ggitech.service && echo "UNEXPECTED: it is running"

# The environment file is present, non-empty and correctly permissioned.
sudo stat -c '%n %U:%G %a' /var/www/ggitech/shared/.env.production

# Exactly one GGITECH vhost is enabled.
sudo grep -rl 'ggitech\.dev' /etc/nginx/sites-enabled/ | wc -l

# The certificate is intact and still renews from the expected webroot.
sudo certbot renew --dry-run --cert-name ggitech.dev

# Node 22, matching what CI builds with.
node --version

# The existing services were not disturbed.
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/ || true
systemctl is-active mysql
```

`The certificate is intact and still renews` is the check that matters for step
6: a wrong `root` in the ACME location keeps serving the already-issued
certificate perfectly and only fails at renewal, roughly 60 days later.

Until steps 1–7 are complete, every deployment fails at the preflight gate
before anything is transferred, with a message pointing back here. Nothing
partial ever reaches the application tree.

---

## Routine deployment

Push to `main`, or run **Deploy to production** from the Actions tab
(`workflow_dispatch`). Nothing else is required.

Watch it with:

```bash
journalctl -u ggitech.service -f
tail -f /var/log/ggitech/deploy.log        # needs sudo
```

`/var/log/ggitech/deploy.log` is `0640 root:root`, so `deploy` cannot read it.
The activator also writes every line to stderr, which means the Actions log
already contains the full activation trace including `systemctl status` and
journal excerpts on failure.

---

## Rollback

There are three levels, in increasing bluntness.

**1. Automatic — nothing to do.** If the service fails to restart, `/api/health`
does not report this exact SHA within 60 s, or the homepage smoke test fails,
`ggitech-activate` restores the previous release, restarts it and re-checks
health before exiting. It reports the outcome as an exit code rather than a
vague failure:

- exit `6` — the previous release was restored **and re-verified healthy**, so
  production is serving it;
- exit `7` — the rollback ran but the restored release did not become healthy:
  production needs a human;
- exit `8` — there was nothing verified to roll back to (a failed *first*
  deployment): production needs a human.

Recovery is never claimed without evidence. `state/active` is only written after
that release has answered `/api/health` with its own SHA, and the workflow then
re-checks `/api/health` independently; unless something is really serving it
fails the run with `RECOVERY UNVERIFIED` instead of reporting success.

**2. Restore the last good release.**

```bash
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate --status'
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate --rollback'
```

`--rollback` is the operator's repair command, and it adapts to what it finds:

| State it finds | What it does |
| --- | --- |
| `current` and `active` agree, and a previous release is recorded | Restores `state/previous` |
| `current` was swapped but success was never recorded (interrupted activation) | Restores `state/active` — the last release that *passed* activation |
| The pointer is already back at the last verified release but the service is down | Re-activates and re-verifies that same release |

In no case does it go back two revisions, and it never reports "nothing to roll
back to" while a verified release exists on the host. A failed rollback does not
cascade into a second rollback: the release that was just rejected is not
something to restore.

**3. Re-activate a specific release that is still on disk.**

```bash
ls -1 /var/www/ggitech/releases/          # candidates, newest last
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate <sha>'
```

Only the last five releases are kept, and the active release, the recorded
rollback target and whatever `current` points at are never pruned. Re-activating
an older release re-runs the full validation, restart, health check and smoke
test.

**Recovering from a cancelled run.** If a deployment is cancelled between the
symlink swap and the health check, `current` may point at an unverified release.
The lock is released as soon as the process exits, so the same three commands
work:

```bash
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate --status'
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate --rollback'
ssh deploy@<host> 'curl -fsS http://127.0.0.1:3213/api/health'
```

### Tested rollback behaviour

`deploy/tests/run-activation-tests.sh` drives the real script through each of
these cases and asserts both the exit code and the resulting on-disk state:

| Scenario | Expected outcome |
| --- | --- |
| Successful first deployment | exit `0`, `active` recorded, no rollback target |
| Failed first deployment, no previous release | exit `8`, `active` unset, release left for inspection |
| Successful upgrade | exit `0`, previous release becomes the rollback target and is retained |
| Failed upgrade, rollback succeeds | exit `6`, `current` restored, rollback target not poisoned |
| Failed rollback | exit `7`, then `--rollback` reports `8`, then `0` once the fault is removed |
| Interrupted activation | `--status` reports `verified=no`; `--rollback` repairs it |
| Repeated activation of the same commit | exit `0`, permissions untouched, no self-referential rollback target |
| Manual rollback to a known-good release | exit `0`, `current` and `active` both restored |
| Missing/malformed artifacts | exit `2`/`3`/`4` for bad ids, absent releases, missing files, wrong SHA, empty `BUILD_ID`, absolute and escaping symlinks, FIFOs, setuid bits, extra arguments, symlinked uploads |
| Concurrent activation | second caller exits `5`; `--status` still answers |

See **Testing** for what this does and does not prove.

---

## Health checking

```bash
curl -fsS http://127.0.0.1:3213/api/health
```

```json
{
  "status": "ok",
  "release": "2d3b95275be75a98e4bfeb439405f633fd7af366",
  "buildId": "…",
  "uptimeSeconds": 41,
  "timestamp": "2026-11-14T10:00:00.000Z"
}
```

A `200` alone is not treated as success. Activation requires **all** of:

1. `/api/health` returns `"status":"ok"` — meaning `.next/BUILD_ID` is readable
   from the release `current` points at, so the process really is serving the
   directory it claims to be;
2. the same response contains `"release":"<the SHA being deployed>"` — if the
   old process never exited, the old SHA is reported and the deploy is rejected;
3. the homepage contains `<main id="main">`, references `https://ggitech.dev`
   and does **not** contain the route error boundary text;
4. the first `/_next/static/**/*.css` referenced by that HTML returns `200` —
   the failure mode where a release boots without its static bundle serves
   perfect HTML whose assets all 404.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| exit `5`, "another activation is already in progress" | A previous run still holds the lock | Wait, or `ps aux \| grep ggitech-activate`. `/run` is tmpfs, so a reboot clears it |
| exit `3`, "release directory does not exist" | The rsync step failed or the SHA never uploaded | Check the Actions upload step, then `ls /home/deploy/uploads` |
| exit `4`, `release is incomplete; missing: .next/static` | The assemble step regressed | The workflow checks for this too; fix `Assemble the standalone release` |
| exit `4`, "release self-identifies as …" | Artifact uploaded under the wrong SHA | Re-run; never rename an upload by hand |
| exit `6` | The app was unhealthy, but the **previous release was restored and is healthy** | Production is serving the previous release; check the journal for what failed |
| exit `7` | Activation failed **and the rollback did not restore service** | Needs a human. `sudo systemctl status ggitech`, then `journalctl -u ggitech -n 100` |
| exit `8` | Activation failed and there was **nothing verified to fall back to** | A failed first deployment. Check the journal, then re-run once the cause is fixed |
| `RECOVERY UNVERIFIED` in the run log | The workflow tried to recover and nothing reported healthy | Do not retry blindly — inspect the host first |
| exit `1`, "production environment file is missing" | Step 2 was skipped, or the file was moved | Re-run step 2 — it will not truncate the existing file |
| exit `1`, "is missing or is a symlink" | A base directory is absent or was replaced by a link | Re-run step 1; check with `ls -ld /var/www/ggitech /var/www/ggitech/releases` |
| Two GGITECH vhosts enabled | A second `ggitech.conf` was added | Re-run step 6; it removes the duplicate after confirming it is a GGITECH vhost |
| Site returns 503 "briefly unavailable" | Normal restart window, or a crash loop | If it persists, `systemctl status ggitech` |
| `sudo: a password is required` | NOPASSWD rule missing or wrong | Reinstall step 4; the workflow always calls `sudo -n` |
| `/api/health` returns 503 `"status":"degraded"` | `.next/BUILD_ID` unreadable | The release tree is not readable by `ggitech`; `prepare_release` should have fixed it |
| Nothing on 3213 | Service down or bound elsewhere | `ss -lntp \| grep 3213` — must be `127.0.0.1:3213`, never `0.0.0.0` |
| Service killed, box sluggish | OOM on a shared 2 GB host | `journalctl -k \| grep -i -E 'oom\|killed process'` |
| 502 from nginx | Node is down | `systemctl restart ggitech`, then check the journal |

Useful one-liners:

```bash
sudo systemctl status ggitech.service --no-pager
sudo journalctl -u ggitech.service --since "15 min ago" --no-pager
sudo tail -n 100 /var/log/ggitech/deploy.log
sudo tail -n 40 /var/log/nginx/ggitech.error.log
ls -l /var/www/ggitech/current
cat /var/www/ggitech/state/active /var/www/ggitech/state/previous
```

---

## Testing

### What is checked on every change

CI (`.github/workflows/ci.yml`) and the deploy workflow's own quality job both
run, on Node 22:

```bash
npm ci
npm run format:check     # Prettier
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run build            # next build (output: standalone)
npm audit --omit=dev --audit-level=high
```

The deployment payload is checked locally with:

```bash
bash -n deploy/bin/ggitech-activate
bash -n deploy/tests/run-activation-tests.sh
shellcheck -S style deploy/bin/ggitech-activate deploy/tests/run-activation-tests.sh
```

### The activation integration tests

`deploy/tests/run-activation-tests.sh` proves the activation and rollback state
machine — the part of this system where a mistake costs production. It runs the
**real, unmodified** activator inside a private mount namespace, with temporary
directories bind-mounted over `/var/www/ggitech`, `/home/deploy/uploads`,
`/var/log/ggitech` and `/run/ggitech-activate.lock`, and stub `systemctl`,
`journalctl` and `curl` bind-mounted over the real ones.

The activator is deliberately not test-aware. A root script whose base directory
could be overridden from the environment would be exactly the vulnerability this
design exists to avoid, so the tests bend the filesystem instead of the script.

```bash
# On a scratch Linux VM or container, as root. Refuses to run on a host that
# already has a GGITECH installation.
sudo deploy/tests/run-activation-tests.sh
sudo KEEP_TMP=1 deploy/tests/run-activation-tests.sh    # keep the sandbox
```

Runtime is about five minutes: three scenarios deliberately wait out the
activator's full 60-second health-check timeout in order to prove the failure
paths.

**Proven by these tests:** argument validation including unexpected extra
arguments and unknown options; rejection of malformed release ids; rejection of
incomplete artifacts, a wrong `RELEASE_SHA`, an empty `BUILD_ID`, absolute
symlinks, symlinks that escape the release, FIFOs, setuid files and a symlinked
upload path; that release code ends up `root:root` and not writable by the
service account while `.next/cache` is handed to `ggitech:ggitech` at `0750`;
and each of the ten scenarios in the rollback table above, including the exact
exit code for every outcome.

**Not proven by these tests** — these need the real server:

- that `systemctl restart ggitech.service` actually starts the Node process;
- that the application actually serves `/api/health`, the homepage, a static
  chunk and an optimised image from a real release;
- that `next/image` can write to `.next/cache` under the real
  `ProtectSystem=strict` sandbox — the tests check the permissions, not the
  kernel's response to them;
- anything about nginx: TLS, the ACME webroot, the 503 fallback, or that the
  Bells portal on 3100 still works;
- that the certificate renews (only `certbot renew --dry-run` on the host
  proves that).

### First-deployment test plan

Run on the server, in order, before enabling automatic deployment.

1. Complete installation steps 1–8 and run the read-only verification block.
   Confirm `nginx -t` passes, `sudo -l -U deploy` lists one command, the service
   is enabled but not active, and `certbot renew --dry-run` succeeds.
2. Record the pre-deployment state, so the first activation has a "before" to
   compare against:

   ```bash
   sudo /usr/local/bin/ggitech-activate --status     # expect: active=<empty>, verified=no
   ls -A /var/www/ggitech/releases/                  # expect: empty
   ```

3. Trigger the workflow with **Deploy to production** (`workflow_dispatch`) and
   watch it. Expect: quality and audit jobs pass, the artifact is uploaded, the
   activation reports exit `0`, and the run reports the release is live.
4. Verify independently, without trusting the workflow:

   ```bash
   curl -fsS http://127.0.0.1:3213/api/health     # status ok, release = the deployed SHA
   curl -fsS -I https://ggitech.dev/              # 200
   curl -fsS http://127.0.0.1:3100/ -o /dev/null -w '%{http_code}\n'   # Bells portal still up
   sudo /usr/local/bin/ggitech-activate --status  # verified=yes
   ```

5. Confirm the release is read-only to the service account and the cache is not:

   ```bash
   sudo find /var/www/ggitech/releases/<sha> -perm /022 -print | head
   sudo stat -c '%U:%G %a' /var/www/ggitech/releases/<sha>/.next/cache
   ```

6. Confirm a second deployment of the same commit is a no-op that still
   re-verifies, and that the first deployment left no rollback target:

   ```bash
   cat /var/www/ggitech/state/active /var/www/ggitech/state/previous
   ```

### Rollback test plan

Perform this **before** the site carries real traffic, and again after any change
to the activator.

1. **Failed upgrade, recovered (exit `6`).** Push a commit that builds but cannot
   serve — the simplest reliable fault is to deploy a commit whose
   `.next/BUILD_ID` has been made unreadable on the server, or to stop the
   service immediately after the restart step. Expect the workflow to report
   exit `6`, and `current` to be back on the previous release with production
   healthy.
2. **Failed rollback (exit `7`).** Only reproducible by breaking every release at
   once — e.g. `sudo chmod 000` on the previous release's `server.js` after the
   new one has failed. Expect exit `7`, and the workflow to fail with
   `RECOVERY UNVERIFIED` rather than claiming success. Restore the permissions
   and confirm `--rollback` recovers.
3. **Interrupted activation.** Start a deployment and `Ctrl-C` the SSH session
   between the symlink swap and the health check, or kill the activator with
   `SIGKILL`. `--status` must report `verified=no`; `--rollback` must repair it,
   and `--status` must then report `verified=yes`.
4. **Manual rollback.** With two releases deployed, run
   `sudo /usr/local/bin/ggitech-activate --rollback` and confirm `current` and
   `state/active` both move to the earlier release and `/api/health` reports it.
5. **Missing artifact.** `sudo rm -rf /var/www/ggitech/releases/<sha>` for a
   release that is not live, then activate that SHA. Expect exit `3` and no
   change to what is being served.

After each step, confirm the Bells portal is still answering on 3100 and that
`sudo nginx -t` still passes.

---

## Downtime

**A deployment is not zero-downtime.** `systemctl restart` stops the old
process before starting the new one, so there is a sub-second window in which
nothing is listening on `127.0.0.1:3213`. During it:

- nginx replaces its own unbranded `502` with a short `503` carrying
  `Retry-After: 3`;
- a request already in flight through an established connection can still fail;
- the health check and smoke test then run against the new release, which is
  what decides whether the deploy is kept.

Measured impact is normally a fraction of a second. Zero-downtime would mean a
blue/green pair on two ports with an nginx `upstream` switch and connection
draining — deliberately not attempted on a 1 vCPU host that is also running the
university portal and MySQL.

Two things make the risk small: the application has no database and no
migrations, so there is no schema step that could be half-applied; and any
release that fails its checks is automatically rolled back.

---

## Security notes

- **The deployment credential is not a root credential.** `deploy` may run one
  command, with no shell, no wildcard and no `systemctl`. Authorization lives
  inside `ggitech-activate`, which validates its own arguments.
- **Every privileged path is derived, never supplied.** The only input is a
  release id, which must match `^[0-9a-f]{40}$`. Every path is built from it;
  nothing caller-supplied reaches a path or a shell unquoted. Releases are
  re-resolved with `realpath -e` and rejected unless their parent is exactly
  `/var/www/ggitech/releases`, and symlinked releases, staging paths and upload
  paths are all refused. The base directories themselves must be real
  directories, not symlinks, so a planted link cannot redirect a later
  `chown -R` outside the tree.
- **The upload is untrusted.** Anything written by `deploy` is validated before a
  single privileged operation touches it: absolute symlinks, symlinks that
  escape the release, devices, sockets, FIFOs and setuid/setgid files are all
  refused, and the artifact is deleted rather than promoted. It is then re-owned
  to `root:root`, so nothing planted by the deployment account survives.
- **The running application cannot modify its own code.** Releases are
  `root:root` with `u=rwX,go=rX`, so the service account can read what it
  executes and nothing else. The single carve-out is `.next/cache`
  (`ggitech:ggitech`, `0750`), which `next/image` and the incremental cache must
  write to — and which the activation's own smoke test exercises by requesting a
  real optimised image, so a broken carve-out fails the deployment instead of a
  visitor's page load.
- **Every privileged path is derived, never supplied.** The only input is the
  release id; the release, staging and upload paths are built from it and
  re-resolved with `realpath -e`, and a release is refused unless its parent is
  exactly `/var/www/ggitech/releases`. The base directories themselves must be
  real directories, not symlinks, so a planted link cannot redirect a later
  `chown -R` outside the tree.
- **Secrets never move.** Production credentials live only in
  `/var/www/ggitech/shared/.env.production` (`0640 root:ggitech`) and are never
  copied into a release, so a rollback cannot resurrect an old credential set.
  The workflow never reads them and never prints them, and no installation step
  truncates them.
- **The host key is pinned.** `GGITECH_SSH_KNOWN_HOSTS` is written to
  `~/.ssh/known_hosts` with `StrictHostKeyChecking yes`, so an intermediary
  cannot present a substitute server. The private key is written `0600` and
  deleted at the end of every run.
- **The service is sandboxed and loopback-only.** `ProtectSystem=strict`, an
  empty `CapabilityBoundingSet`, `HOSTNAME=127.0.0.1` — port 3213 is not
  reachable from the internet, so nginx cannot be bypassed, which is in turn
  what makes `TRUSTED_PROXY_HOPS=1` correct.
- **The workflow has read-only repository access** (`permissions: contents:
  read`) and pushes nothing back to GitHub.

---

## Known limitations

- **Merge the workflow to `main` and automatic deployment is armed.** That is
  the intended behaviour, and also the reason the first deploy should be a
  deliberate decision rather than a side effect of merging. Attach required
  reviewers to the `production` environment in repository settings to put a
  manual gate in front of it; the workflow already references that environment.
- Deployments are serialised by the `production-deploy` concurrency group, and
  they are never cancelled: interrupting a run between the symlink swap and the
  health check would leave a release in an unknown state. A second push queues
  rather than racing.
- A queued run re-checks ancestry before it uploads anything. If the commit it
  would deploy is an ancestor of the release already live, it stops rather than
  replacing a newer working release with an older one; the check is
  `git merge-base --is-ancestor`, not queue order. If the live SHA is not in the
  checkout the check cannot be made, so the run warns and proceeds — the health
  check is still there as the backstop.
- Only the five most recent releases are kept. Re-activating something older is
  impossible without rebuilding it.
- Only `main` may deploy; a manual run from another branch fails at the guard
  step before it reaches the server.
- Rotating the deployment credential means generating a new key pair, updating
  `GGITECH_SSH_KEY` and the `deploy` account's `authorized_keys`, then removing
  the old key from both.
- The in-process rate limiter resets on every deploy. Setting the two Upstash
  variables moves the counters out of the process and fixes that without a code
  change.
