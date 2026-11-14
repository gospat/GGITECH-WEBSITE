#!/usr/bin/env bash
#
# run-nginx-validation.sh — exercise deploy/nginx/ggitech.conf against a real
# nginx.
#
# Isolation strategy
# -----------------
# The vhost hard-codes every path it uses: the certificate lineage, the ACME
# webroot, the proxy target and its log files. Rather than rewrite those so the
# file can be tested somewhere convenient -- which would mean the artefact under
# test is not the artefact that ships -- this script stands up those paths for
# real on a disposable host and installs the file unmodified. The only assertion
# it makes about the file itself is that the installed copy is byte-identical to
# the one in the repository.
#
# Requirements: Linux, root, nginx, openssl, curl, python3.
#
# This is not the activation suite and it does not touch it: nothing here
# installs or runs ggitech-activate, systemd, or the application.
#
# Usage:
#   sudo deploy/tests/run-nginx-validation.sh
#
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly CONF="$SCRIPT_DIR/../nginx/ggitech.conf"

readonly SITE=/etc/nginx/sites-available/ggitech
readonly WEBROOT=/var/www/ggitech-acme
readonly CERT_DIR=/etc/letsencrypt/live/ggitech.dev
readonly UPSTREAM_PORT=3213
readonly UPSTREAM_LOG=/tmp/ggitech-upstream.log
readonly UPSTREAM_PID=/tmp/ggitech-upstream.pid
readonly UPSTREAM_SCRIPT=/tmp/ggitech-upstream.py
readonly TOKEN=acme-token-ok
readonly CANONICAL=https://ggitech.dev

passed=0
failed=0

ok() { printf '  ok    %s\n' "$1"; passed=$((passed + 1)); }
no() {
  printf '  FAIL  %s\n' "$1"
  failed=$((failed + 1))
}

expect() { # expect <description> <expected> <actual>
  if [[ $2 == "$3" ]]; then
    ok "$1"
  else
    no "$1: expected [$2], got [$3]"
  fi
}

expect_contains() { # expect_contains <description> <needle> <haystack>
  if [[ $3 == *"$2"* ]]; then
    ok "$1"
  else
    no "$1: [$2] not found in [$3]"
  fi
}

cleanup() {
  nginx -s quit 2>/dev/null || true
  if [[ -f $UPSTREAM_PID ]]; then
    kill "$(cat "$UPSTREAM_PID")" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# --------------------------------------------------------------------------
# The environment the vhost assumes
# --------------------------------------------------------------------------
printf 'ggitech nginx validation\n'
printf 'config    : %s\n' "$CONF"
printf 'nginx     : %s\n\n' "$(nginx -v 2>&1)"

# A certificate for both names, because the vhost requires one: the www block
# cannot complete a handshake it has no certificate for.
mkdir -p -- "$CERT_DIR"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj '/CN=ggitech.dev' \
  -addext 'subjectAltName=DNS:ggitech.dev,DNS:www.ggitech.dev' 2>/dev/null

mkdir -p -- "$WEBROOT/.well-known/acme-challenge"
# No trailing newline: certbot writes the key authorisation exactly as the
# certificate authority issued it, and the assertion below compares the body
# byte for byte.
printf '%s' "$TOKEN" >"$WEBROOT/.well-known/acme-challenge/test-token"
chmod -R a+rX "$WEBROOT"

# The distro default site is a second `listen 80` block with default_server and
# claims the names this vhost has to answer for. Removed on this disposable host
# only.
rm -f -- /etc/nginx/sites-enabled/default

# The upstream the proxy points at. It records the headers nginx sent it.
cat >"$UPSTREAM_SCRIPT" <<'PY'
import http.server
import socketserver


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        with open("/tmp/ggitech-upstream.log", "a", encoding="utf-8") as log:
            log.write(
                "path=%s host=%s xff=%s xfp=%s xfh=%s\n"
                % (
                    self.path,
                    self.headers.get("Host"),
                    self.headers.get("X-Forwarded-For"),
                    self.headers.get("X-Forwarded-Proto"),
                    self.headers.get("X-Forwarded-Host"),
                )
            )
        body = b'<html><body><main id="main">stub upstream</main></body></html>'
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", 3213), Handler) as server:
    server.serve_forever()
PY

: >"$UPSTREAM_LOG"

start_upstream() {
  python3 "$UPSTREAM_SCRIPT" &
  echo $! >"$UPSTREAM_PID"
  for _ in $(seq 1 50); do
    if curl -fsS -o /dev/null "http://127.0.0.1:$UPSTREAM_PORT/"; then break; fi
    sleep 0.1
  done
}

stop_upstream() {
  if [[ -f $UPSTREAM_PID ]]; then
    kill "$(cat "$UPSTREAM_PID")" 2>/dev/null || true
    rm -f -- "$UPSTREAM_PID"
  fi
  # Wait for the port to actually be released, or the 502 scenario would race.
  for _ in $(seq 1 50); do
    if ! curl -fsS -o /dev/null "http://127.0.0.1:$UPSTREAM_PORT/" 2>/dev/null; then return 0; fi
    sleep 0.1
  done
}

# --------------------------------------------------------------------------
# 1. The configuration is accepted, installed unmodified
# --------------------------------------------------------------------------
printf '== 1. The configuration loads\n'

install -o root -g root -m 0644 "$CONF" "$SITE"
ln -sfn -- "$SITE" /etc/nginx/sites-enabled/ggitech

if cmp -s -- "$CONF" "$SITE"; then
  ok "the installed vhost is byte-identical to the repository copy"
else
  no "the installed vhost differs from the repository copy"
fi

if nginx -t >/tmp/ggitech-nginx-t.log 2>&1; then
  ok "nginx -t accepts the configuration"
else
  no "nginx -t rejected the configuration"
  cat /tmp/ggitech-nginx-t.log
  exit 1
fi

if grep -q 'syntax is ok' /tmp/ggitech-nginx-t.log; then
  ok "nginx -t reports the syntax is ok"
else
  no "nginx -t did not report 'syntax is ok'"
fi

if grep -qi 'warn\|error' /tmp/ggitech-nginx-t.log; then
  no "nginx -t emitted a warning or error: $(grep -i 'warn\|error' /tmp/ggitech-nginx-t.log)"
else
  ok "nginx -t emitted no warnings"
fi

# The portal's isolation is a property of this file: no *directive* may name the
# portal or its upstream.
if [[ -z $(grep -v '^[[:space:]]*#' "$CONF" | grep -i 'bells\|:3100\|3100' || true) ]]; then
  ok "no directive references the Bells portal or port 3100"
else
  no "the configuration references the portal: $(grep -v '^[[:space:]]*#' "$CONF" | grep -i 'bells\|3100')"
fi

start_upstream
nginx
for _ in $(seq 1 50); do
  if curl -fsS -k -o /dev/null --resolve ggitech.dev:443:127.0.0.1 "$CANONICAL/"; then break; fi
  sleep 0.1
done
ok "nginx started"

# --------------------------------------------------------------------------
# Helpers for the functional assertions
# --------------------------------------------------------------------------
request() { # request <url> -> "<code> <redirect_url> <remote-ip>"
  curl -sS -k -o /dev/null \
    -w '%{http_code} %{redirect_url} %{remote_ip}' \
    --resolve ggitech.dev:80:127.0.0.1 \
    --resolve ggitech.dev:443:127.0.0.1 \
    --resolve www.ggitech.dev:80:127.0.0.1 \
    --resolve www.ggitech.dev:443:127.0.0.1 \
    "$1"
}

code_of() { cut -d' ' -f1 <<<"$1"; }
target_of() { cut -d' ' -f2 <<<"$1"; }

# --------------------------------------------------------------------------
# 2. Every non-canonical form redirects to the apex, path and query intact
# --------------------------------------------------------------------------
printf '\n== 2. The canonical redirects\n'

# Quoted: the `&` separates two query parameters, and unquoted it would be read
# as a job-control operator and background the assignment.
readonly PATH_AND_QUERY='/services?utm_source=x&utm_medium=email'
readonly EXPECTED_TARGET="$CANONICAL$PATH_AND_QUERY"

assert_redirect() { # assert_redirect <description> <url>
  local r
  r="$(request "$2")"
  expect "$1 (status)" "301" "$(code_of "$r")"
  expect "$1 (target)" "$EXPECTED_TARGET" "$(target_of "$r")"
}

assert_redirect "http apex redirects to the canonical HTTPS host" "http://ggitech.dev$PATH_AND_QUERY"
assert_redirect "http www redirects to the canonical host in one hop" "http://www.ggitech.dev$PATH_AND_QUERY"
assert_redirect "https www redirects to the canonical host" "https://www.ggitech.dev$PATH_AND_QUERY"

# The redirect target must never be built from the requested host, or the www
# vhost would answer with www and loop.
r="$(request "https://www.ggitech.dev$PATH_AND_QUERY")"
if [[ $(target_of "$r") != *www.ggitech.dev* ]]; then
  ok "the www redirect target does not name www (no loop)"
else
  no "the www redirect target names www: $(target_of "$r")"
fi

# --------------------------------------------------------------------------
# 3. The canonical host serves the application
# --------------------------------------------------------------------------
printf '\n== 3. The canonical host serves the application\n'

r="$(request "$CANONICAL$PATH_AND_QUERY")"
expect "https apex is served, not redirected (status)" "200" "$(code_of "$r")"
expect "https apex has no redirect target" "" "$(target_of "$r")"

body="$(curl -sS -k --resolve ggitech.dev:443:127.0.0.1 "$CANONICAL/")"
expect_contains "the upstream body reaches the client" 'main id="main"' "$body"

# www must not reach the application at all.
r="$(request "https://www.ggitech.dev/")"
if [[ $(code_of "$r") == "301" ]]; then
  ok "www never reaches the application"
else
  no "www returned $(code_of "$r") instead of redirecting"
fi

# --------------------------------------------------------------------------
# 4. The proxy header contract is unchanged
# --------------------------------------------------------------------------
printf '\n== 4. The proxy headers\n'

: >"$UPSTREAM_LOG"
request "$CANONICAL/" >/dev/null
sleep 0.3
upstream="$(cat "$UPSTREAM_LOG")"

expect_contains "the upstream sees the canonical Host" 'host=ggitech.dev' "$upstream"
expect_contains "the upstream is told the request was HTTPS" 'xfp=https' "$upstream"
expect_contains "the upstream sees a forwarded client address" 'xff=127.0.0.1' "$upstream"

# --------------------------------------------------------------------------
# 5. The ACME challenge is served over plain HTTP, for both names
# --------------------------------------------------------------------------
printf '\n== 5. The ACME challenge\n'

for name in ggitech.dev www.ggitech.dev; do
  challenge="$(curl -sS -o - -w '|%{http_code}' --resolve "$name:80:127.0.0.1" \
    "http://$name/.well-known/acme-challenge/test-token")"
  expect "http://$name serves the challenge without redirecting (status)" \
    "200" "${challenge##*|}"
  expect "http://$name returns the token" "${TOKEN}" "${challenge%%|*}"
done

# --------------------------------------------------------------------------
# 6. A refused upstream still produces the honest fallback
# --------------------------------------------------------------------------
printf '\n== 6. The unavailable page\n'

stop_upstream
r="$(request "$CANONICAL/")"
# 502, not 503. `error_page 502 @unavailable;` redirects the *body* to the named
# location but keeps the code nginx raised, because the `=` form is what lets
# the target choose the response code. This assertion pins what the deployed
# configuration actually does; deploy/README.md describes the same behaviour.
expect "a refused upstream is answered by the fallback (status)" "502" "$(code_of "$r")"

unavailable="$(curl -sS -k -D - -o - --resolve ggitech.dev:443:127.0.0.1 "$CANONICAL/" || true)"
# HTTP/2 lower-cases header names, so the header dump is folded before matching.
headers="$(tr '[:upper:]' '[:lower:]' <<<"$unavailable")"
expect_contains "the stock nginx page is not shown" 'briefly unavailable' "$unavailable"
expect_contains "the fallback carries Retry-After (lower-cased by HTTP/2)" 'retry-after: 3' "$headers"
if [[ $unavailable != *'<html>'* ]]; then
  ok "the fallback is the short plain-text page, not the stock error document"
else
  no "the stock nginx error document was served"
fi

# --------------------------------------------------------------------------
printf '\n----------------------------------------\n'
printf 'passed: %d\n' "$passed"
printf 'failed: %d\n' "$failed"
printf '\n'

if ((failed > 0)); then
  exit 1
fi
