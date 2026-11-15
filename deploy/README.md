# GGITECH production deployment

Everything needed to run `https://ggitech.dev` on the DigitalOcean host, and to
deploy to it from GitHub Actions without a human logging in.

This host also runs the **Bells University certificate verification portal** on
port 3100. Nothing in this directory touches that application: it has its own
systemd unit, its own nginx `server` block and its own database. The single
shared resource is the nginx process itself, and adding a vhost to it is a
graceful reload.

One thing is genuinely shared with it, though: the HTTPS listening socket for
port 443. Every HTTPS `server` block on the host answers on that one socket, and
nginx 1.24 treats the protocol options on a socket (`ssl`, `http2`) as belonging
to the socket rather than to a block. That is why the `listen` lines in
`deploy/nginx/ggitech.conf` are arranged the way they are — see
*The 443 listening socket, and the protocol-option warning* under Testing, and
step 9 before editing them.

## This installs over a server that is already serving traffic

`https://ggitech.dev` is already served by an existing nginx virtual host on
that host, but the **Next.js application itself has never been installed or
started**: there is no release under `/var/www/ggitech/releases`, and nothing is
listening on port 3213. Only the server-side scaffolding — the directories, the
environment file and the systemd unit — is already in place.

That gap is what orders the whole runbook. The application is installed and its
**first release is activated and verified on `127.0.0.1:3213` while the existing
GGITECH vhost is left exactly as it is**. The vhost that proxies to the
application is installed last, in step 9, once something is really answering on
that port, so the working site is never pointed at a port with nothing behind
it.

Nothing in the deployment depends on the vhost having been updated:
`ggitech-activate` reaches the application directly on `127.0.0.1:3213`, and the
deploy workflow's own health check does the same over SSH. Neither ever fetches
`https://ggitech.dev`.

The facts this runbook is written against:

| Fact | Value |
| --- | --- |
| OS | Ubuntu 24.04, 1 vCPU / 2 GB RAM / 2 GB swap |
| Hostname | `ggitech` |
| Administrator | `admin` |
| Application account | `ggitech` |
| Deployment account | `deploy` |
| Node.js | 22 |
| Application port | `3213` (loopback only) |
| **Next.js application** | **not installed and not running** — nothing listens on 3213 |
| HTTPS | `ggitech.dev` already served by the existing vhost |
| Let's Encrypt HTTP-01 webroot | `/var/www/ggitech-acme` |
| Existing nginx vhost | `/etc/nginx/sites-available/ggitech` → `sites-enabled/ggitech` |
| Environment file | `/var/www/ggitech/shared/.env.production` (already exists) |
| Application directories | already exist, but hold no release |
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
- **The reverse proxy is replaced last**, only after the first release is live
  and verified on `127.0.0.1:3213`.
- Every step is safe to run twice.

---

## Contents

| Path | What it is |
| --- | --- |
| `.github/workflows/deploy-production.yml` | Validate, build, transfer, activate, verify, recover |
| `.github/workflows/ci.yml` | Formatting, lint, typecheck, tests, build, dependency audit on every PR |
| `app/api/health/route.ts` | Readiness endpoint the pipeline and the activator poll |
| `docs/email.md` | Resend domain verification, DNS records, template changes and previews |
| `deploy/bin/ggitech-activate` | Root-owned activation script — the only privileged command `deploy` may run |
| `deploy/sudoers/ggitech-activate` | The single sudoers rule that grants it |
| `deploy/systemd/ggitech.service` | The application service |
| `deploy/nginx/ggitech.conf` | Reverse proxy for the canonical host `ggitech.dev`, the permanent redirects onto it, and the single `http2` declaration for the 443 socket it shares with the portal |
| `deploy/tests/run-activation-tests.sh` | Linux-only integration tests for the activation and rollback state machine |
| `deploy/tests/run-nginx-validation.sh` | Linux-only validation of the vhost against a real nginx: canonical redirects, proxy headers, ACME, the fallback, and the 443 socket's HTTP/2 negotiation |

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
| `4` | The release was found but is unusable: unsafe or invalid content, a `RELEASE_SHA` mismatch, or it could not be prepared and owned on disk | The artifact was rejected and deleted, or `prepare_release` refused it and nothing was swapped |
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

Steps 1–7 install everything the deployment needs; step 8 activates the first
release and proves it on loopback; **step 9 is the only step that changes the
public site, and it runs last**. Each step is safe to re-run. Nothing here
deletes a directory, truncates a file or reissues a certificate.

> **The existing GGITECH vhost is not touched until step 9.** While steps 1–8
> run, `https://ggitech.dev` keeps being served by the configuration that is
> already in `/etc/nginx/sites-available/ggitech`.

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
empty a working configuration, and the application would only fail later, when a
visitor submitted the form.

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

The Resend API key lives only in this file, on this server. It is never copied
into a release, never read by the workflow and never printed. That is also why a
rollback cannot resurrect a stale credential set.

Required contents:

```dotenv
# Outbound email (Resend HTTPS API). Server-only: the workflow never sees these.
# An existing SMTP block can be deleted once these values are in place — the
# application no longer reads SMTP_* or FROM_EMAIL.
RESEND_API_KEY=
RESEND_FROM_EMAIL=GGITECH <notifications@ggitech.dev>
CONTACT_NOTIFICATION_EMAIL=
CONTACT_REPLY_TO_EMAIL=
CONTACT_AUTO_REPLY_ENABLED=true

# Baked into the build by the workflow; kept here so that server-rendered
# origin checks agree with what was compiled in.
NEXT_PUBLIC_SITE_URL=https://ggitech.dev

# Public mailbox advertised to customers (contact page, error messages,
# careers links, structured data). Leave blank until a real mailbox exists and
# has been tested — a blank or malformed value is treated as "not configured",
# and every link falls back to the contact form. Unlike the Resend values, this
# one is inlined at build time: changing it needs a rebuild, not a restart.
NEXT_PUBLIC_CONTACT_EMAIL=

NEXT_PUBLIC_ENABLE_3D=false

# Optional. Without these, rate-limit counters live in the process and reset on
# every deploy. The service runs a single process, so the in-process fallback is
# correct but not durable across releases.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# nginx is the only proxy in front of the app, so exactly one hop is trusted.
# Set this to 0 only if Node is ever exposed directly, which it is not. This is
# also what stops a forged X-Forwarded-For header from earning a fresh
# rate-limit bucket.
TRUSTED_PROXY_HOPS=1
```

Two notes on the email values:

- `RESEND_FROM_EMAIL` must be an address on the Resend-verified domain. Sending
  from `notifications@ggitech.dev` **does not create that mailbox** — it only
  authorises the domain. Replies route to `CONTACT_REPLY_TO_EMAIL`, so no mailbox
  is needed for it to work.
- The service **starts** without these values. It refuses the submission instead,
  answering `503` with a generic message, and logs `reason: "config:Missing
  required environment variable: …"`. Verify with a real submission after adding
  them — a green deploy does not prove the key works.

Domain verification and the exact DNS records are in [`docs/email.md`](../docs/email.md).

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

### 6. The upload directory

```bash
sudo install -d -o deploy -g deploy -m 0700 /home/deploy/uploads
```

The existing SSH connection test asserts this directory exists, and the
workflow uploads into it. It is the only path outside `/var/www/ggitech` that
the activation script reads from, and it is never read before the upload is
re-owned and re-validated.

### 7. Verify before the first deploy

Everything here is read-only. Run it after steps 1–6 and before the first
deployment. The existing GGITECH vhost is still in place at this point and
should still be serving `https://ggitech.dev` — check that it is, because it is
the thing step 9 is about to change.

```bash
sudo visudo -c                                          # sudoers parses
sudo -l -U deploy                                       # exactly one command
sudo systemd-analyze verify /etc/systemd/system/ggitech.service
sudo nginx -t                                           # the CURRENT vhosts parse
sudo -u deploy ssh -o BatchMode=yes localhost true      # deploy can SSH out (not required)
sudo systemctl is-enabled ggitech.service                # enabled, not running
sudo systemctl is-active ggitech.service && echo "UNEXPECTED: it is running"

# The environment file is present, non-empty and correctly permissioned.
sudo stat -c '%n %U:%G %a' /var/www/ggitech/shared/.env.production

# Exactly one GGITECH vhost is enabled, and nothing is listening on 3213 yet.
sudo grep -rl 'ggitech\.dev' /etc/nginx/sites-enabled/ | wc -l
ss -lntp | grep 3213 || echo "nothing on 3213 yet — expected"

# The public site still works on the configuration that was already there.
curl -fsS -o /dev/null -w 'public=%{http_code}\n' https://ggitech.dev/

# The certificate is intact and still renews.
sudo certbot renew --dry-run --cert-name ggitech.dev

# Node 22, matching what CI builds with.
node --version

# The existing services were not disturbed.
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/ || true
systemctl is-active mysql
```

Until steps 1–6 are complete, every deployment fails at the preflight gate
before anything is transferred, with a message pointing back here. Nothing
partial ever reaches the application tree.

### 8. First deployment — activate, then verify on 3213

Nothing is listening on 3213 yet, and the public site is still being served by
the vhost that was already there. That is deliberate: the first release is
activated and proven **on loopback**, so if it is wrong, the public site was
never pointing at it.

Run **Deploy to production** from the Actions tab (`workflow_dispatch`) and
watch the run. Then verify on the host, without trusting the workflow:

```bash
curl -fsS http://127.0.0.1:3213/api/health     # status ok, release = the deployed SHA
sudo /usr/local/bin/ggitech-activate --status  # active=<sha>, verified=yes
sudo systemctl status ggitech.service --no-pager | head -5
ls -l /var/www/ggitech/current                 # -> releases/<sha>
```

Do **not** go on to step 9 until `/api/health` answers on `127.0.0.1:3213` with
the SHA that was just deployed, and `--status` reports `verified=yes`. If it does
not, the deployment failed — and there is no rush, because the public site is
still being served by the old vhost, so waiting costs nothing. A first
deployment that fails has no previous release to fall back to and exits `8`; see
Troubleshooting.

The application is running, but it is **not yet publicly reachable**. Step 9
connects the two.

### 9. The reverse proxy — only once 3213 answers

Now, and not before, point the existing GGITECH vhost at the application. This
is the step where it is easiest to break a working server, because `ggitech.dev`
is **already served** by a vhost that has no `.conf` suffix:

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

# The certificate must carry www as well as the apex: a browser asking for
# https://www.ggitech.dev has to finish a TLS handshake before it can be told
# to go anywhere else, so a lineage without www cannot deliver the redirect.
sudo openssl x509 -in /etc/letsencrypt/live/ggitech.dev/fullchain.pem \
  -noout -ext subjectAltName
```

Expect `DNS:ggitech.dev` and `DNS:www.ggitech.dev` in that output. If www is
absent, add it to the same lineage and reload — `sudo certbot --nginx -d
ggitech.dev -d www.ggitech.dev` on an existing lineage extends it rather than
replacing it — then install the vhost. Never reissue from scratch.

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

`nginx -t` must also be **silent**. This vhost shares the 443 socket with the
portal, and nginx 1.24 warns when two blocks on one socket declare different
protocol options — which is what `protocol options redefined for 0.0.0.0:443`
means. The repository's file is arranged so that does not happen: the apex block
declares `listen 443 ssl http2`, the www block declares `listen 443 ssl`, and
HTTP/2 is a property of the socket, so all three hosts — apex, www and the
portal — still negotiate h2. See Troubleshooting before "fixing" that warning.

The old configuration is still at `$SITE.bak.<timestamp>` afterwards. Keep it
until step 10 has passed, then remove it.

#### Canonical domain

`ggitech.dev` is the canonical host, and it is the only host that serves the
application. The vhost enforces that with permanent redirects, all of which
carry the path and the query string across:

| Request | Response |
| --- | --- |
| `http://ggitech.dev/services?utm_source=x` | `301 https://ggitech.dev/services?utm_source=x` |
| `http://www.ggitech.dev/services?utm_source=x` | `301 https://ggitech.dev/services?utm_source=x` |
| `https://www.ggitech.dev/services?utm_source=x` | `301 https://ggitech.dev/services?utm_source=x` |
| `https://ggitech.dev/services?utm_source=x` | `200`, proxied to `127.0.0.1:3213` |

Two details are worth knowing, because the obvious alternative is wrong:

- **The redirect target is spelled out, not built from `$host`.** `$host` is the
  name the client asked for, so a redirect written `https://$host$request_uri`
  on the www vhost answers `https://www.ggitech.dev/...` — the same host that
  then has to redirect again. A literal target cannot loop.
- **www gets its own `server` block for HTTPS.** A client asking for
  `https://www.ggitech.dev` must complete the TLS handshake before it can be
  sent anywhere, so www has to be a name nginx answers for. Without that block
  the request would fall through to the default server for port 443 — the
  application — and the site would be served on two hostnames.

The ACME location sits in the plain-HTTP block ahead of the redirect, and that
block answers both names, so renewals keep working for a lineage that covers
both — including `certbot`'s HTTP-01 validation for a challenge it fetches over
`http://www.ggitech.dev/...`.

Nothing about the redirect needs a certificate of its own: the www block reuses
the existing lineage, so the check at the top of this step is the only
prerequisite.

**If the public site breaks here, the application is not the problem.** Put the
backup back and reload — that restores exactly the configuration which was
serving `https://ggitech.dev` a moment ago:

```bash
sudo cp -a "$SITE".bak.* "$SITE" && sudo nginx -t && sudo systemctl reload nginx
sudo /usr/local/bin/ggitech-activate --status
```

### 10. Verify the public site

```bash
curl -fsS -o /dev/null -w 'https=%{http_code}\n' https://ggitech.dev/
curl -fsS -o /dev/null -w 'bells=%{http_code}\n' http://127.0.0.1:3100/
sudo nginx -t
sudo certbot renew --dry-run --cert-name ggitech.dev
```

Then check the canonical redirects. `%{redirect_url}` reports where a redirect
points without following it, which is what makes the target visible:

```bash
# Every non-canonical form lands on https://ggitech.dev, path and query intact.
for url in 'http://ggitech.dev/services?utm_source=x' \
           'http://www.ggitech.dev/services?utm_source=x' \
           'https://www.ggitech.dev/services?utm_source=x'; do
  printf '%-46s -> ' "$url"
  curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' "$url"
done

# The canonical host serves the site, and it does not redirect.
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://ggitech.dev/
```

Every line of the first block must read `301 https://ggitech.dev/...`, and the
last line must be `200` with an empty redirect URL. A `301` on the last line
would mean the canonical host is redirecting to itself.

Then confirm that all three names still negotiate HTTP/2 on the shared socket.
`%{http_version}` reports what ALPN settled on, so it must be `2` in each case —
including the portal, whose `server` block does not mention `http2` at all:

```bash
for url in https://ggitech.dev/ https://www.ggitech.dev/ \
           https://certificate.bellsuniversity.edu.ng/; do
  printf '%-46s -> ' "$url"
  curl -sS -k -o /dev/null -w '%{http_version}\n' --http2 "$url"
done
```

A `1.1` anywhere would mean the socket lost HTTP/2 — most likely because
`http2` was removed from the apex block as well as the www block.

`The certificate is intact and still renews` is the check that matters for the
ACME webroot installed in step 9: a wrong `root` keeps serving the
already-issued certificate perfectly and only fails at renewal, roughly 60 days
later.

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

### Rollback behaviour covered by the integration tests

`deploy/tests/run-activation-tests.sh` drives the real script through each of
these cases and asserts both the exit code and the resulting on-disk state.
Read **Execution status** under *Testing* before treating any row as verified:

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
| A release that cannot be prepared | exit `4`; the symlink is not moved, the live release keeps serving, and no rollback is attempted |
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
| exit `4`, "could not be prepared for activation" | `prepare_release` could not create `.next/cache`, or its `chown`/`chmod` failed — see the line above it in the log | **Nothing was swapped**, so the site is still serving the previous release. Fix the host and re-run |
| exit `4`, "could not hand … to ggitech:ggitech" | The service account does not exist on the host, or the filesystem is full | `getent passwd ggitech` must return a line; re-run step 1 if not |
| exit `6` | The app was unhealthy, but the **previous release was restored and is healthy** | Production is serving the previous release; check the journal for what failed |
| exit `7` | Activation failed **and the rollback did not restore service** | Needs a human. `sudo systemctl status ggitech`, then `journalctl -u ggitech -n 100` |
| exit `8` | Activation failed and there was **nothing verified to fall back to** | A failed first deployment. Check the journal, then re-run once the cause is fixed |
| `RECOVERY UNVERIFIED` in the run log | The workflow tried to recover and nothing reported healthy | Do not retry blindly — inspect the host first |
| exit `1`, "production environment file is missing" | Step 2 was skipped, or the file was moved | Re-run step 2 — it will not truncate the existing file |
| exit `1`, "is missing or is a symlink" | A base directory is absent or was replaced by a link | Re-run step 1; check with `ls -ld /var/www/ggitech /var/www/ggitech/releases` |
| Two GGITECH vhosts enabled | A second `ggitech.conf` was added | Re-run step 9; it removes the duplicate after confirming it is a GGITECH vhost |
| `nginx -t` warns `protocol options redefined for 0.0.0.0:443` | A block on the shared 443 socket declared a different set of protocol options — in practice `http2` repeated on the www block | Re-run step 9 with the repository's vhost: only the apex block declares `http2`, and the www block declares `ssl` alone. Do not "fix" it by removing `http2` from the apex block instead — that would turn HTTP/2 off for every host on the socket, the portal included |
| The public site returns 502/503 straight after installation | Step 9 ran before step 8, so the vhost proxies to a port with nothing on it | The application has not been deployed yet — complete step 8. To restore the old site meanwhile, put `$SITE.bak.<ts>` back and reload nginx |
| Site returns 502 "briefly unavailable" | Normal restart window, or a crash loop | If it persists, `systemctl status ggitech` |
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
npm test                 # Vitest (Resend and the renderer are mocked)
npm run build            # next build (output: standalone)
npm audit --omit=dev --audit-level=high
```

The deployment payload is checked locally with:

```bash
bash -n deploy/bin/ggitech-activate
bash -n deploy/tests/run-activation-tests.sh
bash -n deploy/tests/run-nginx-validation.sh
shellcheck -S style deploy/bin/ggitech-activate \
  deploy/tests/run-activation-tests.sh deploy/tests/run-nginx-validation.sh
```

### The activation integration tests

`deploy/tests/run-activation-tests.sh` exercises the activation and rollback
state machine — the part of this system where a mistake costs production. It
runs the **real, unmodified** activator inside a private mount namespace, with
temporary directories bind-mounted over `/var/www/ggitech`, `/home/deploy/uploads`,
`/var/log/ggitech` and `/run/ggitech-activate.lock`, and stub `systemctl`,
`journalctl` and `curl` bind-mounted over the real ones.

The activator is deliberately not test-aware. A root script whose base directory
could be overridden from the environment would be exactly the vulnerability this
design exists to avoid, so the tests bend the filesystem instead of the script.

The same applies to the `ggitech` service account the activator chowns to: rather
than creating an account on the machine running the tests, the suite appends the
identity to private copies of `/etc/passwd`, `/etc/group` and `/etc/nsswitch.conf`
and bind-mounts those *inside the namespace only*. Nothing outside the namespace
can see them, and no account, group or system file is created, modified or deleted
on the host — a run leaves the machine exactly as it found it.

```bash
# On a scratch Linux VM or container, as root. Refuses to run on a host that
# already has a GGITECH installation.
sudo deploy/tests/run-activation-tests.sh
sudo KEEP_TMP=1 deploy/tests/run-activation-tests.sh    # keep the sandbox
```

Runtime is about five minutes: three scenarios deliberately wait out the
activator's full 60-second health-check timeout in order to prove the failure
paths.

**What the suite asserts:** argument validation including unexpected extra
arguments and unknown options; rejection of malformed release ids; rejection of
incomplete artifacts, a wrong `RELEASE_SHA`, an empty `BUILD_ID`, absolute
symlinks, symlinks that escape the release, FIFOs, setuid files and a symlinked
upload path; that release code ends up `root:root` and not writable by the
service account while `.next/cache` is handed to `ggitech:ggitech` at `0750`;
that a release whose preparation fails exits `4` without the symlink ever being
moved; and each of the eleven scenarios in the rollback table above, including
the exact exit code for every outcome.

#### Execution status

The suite was executed in a disposable `ubuntu-24.04` GitHub Actions runner
(Ubuntu 24.04.5 LTS, x86_64, kernel `7.0.0-1017-azure`) — the same OS class as
the production host. It has **never been run against the DigitalOcean host**, and
no part of this deployment system has been activated anywhere.

The result was **97 assertions passed, 0 failed**, across all eleven scenarios:

| Scenario | Observed exit codes |
| --- | --- |
| 1. Successful first deployment | `0` |
| 2. Failed first deployment, no previous release | `8` |
| 3. Successful upgrade | `0` |
| 4. Failed upgrade followed by a successful rollback | `6` |
| 5. Failed rollback, then manual recovery once the fault is removed | `7`, then `8`, then `0` |
| 6. Interrupted activation repaired by `--rollback` | `0` |
| 7. Repeated activation of the same commit | `0` |
| 8. Manual rollback to a known-good release | `0` |
| 9. Missing, malformed and malicious artifacts | `3`, `4`, `2` |
| 10. Concurrent activation refused | `5` |
| 11. A release that cannot be prepared | `4` |

After the suite exited, the runner was inspected and was clean: no `ggitech`
account or group had been created, there was no `/var/www/ggitech`, no bind mount
from the suite survived, and `/etc/passwd` still held zero `ggitech` entries.
That is the evidence for the isolation claim above — the service identity is
supplied by private NSS copies inside the suite's own mount namespace, and the
host's accounts are never created, modified or deleted.

The first run of the suite (94 passed, 3 failed) found two real defects in the
activator and one in the suite itself. All three were corrected before the
passing run above:

| Defect | Correction |
| --- | --- |
| A release that did not exist produced exit `4`, not the documented `3` | `resolve_release` now returns non-zero instead of calling `die`, and `activate_release` performs the `exit` outside the command substitution, so code `3` propagates |
| A failed `mkdir`, `chown` or `chmod` in `prepare_release` was unchecked, and since `activate_release` is invoked in a `||` list, `set -e` is suppressed inside it — an unprepared release could have been promoted live | Every step of `prepare_release` is checked and returns non-zero; the call site exits `4` **before** the symlink moves, so the live release keeps serving |
| Scenario 8 (the suite, not the activator): the fixture left the stub health endpoint reporting the release the rollback had just replaced, so the activator correctly refused to claim a rollback it could not verify | The fixture now moves with the restart, which is what a real rollback does |

**Not proven by these tests** — these need the real server:

- that `systemctl restart ggitech.service` actually starts the Node process;
- that the application actually serves `/api/health`, the homepage, a static
  chunk and an optimised image from a real release;
- that `next/image` can write to `.next/cache` under the real
  `ProtectSystem=strict` sandbox — the tests check the permissions, not the
  kernel's response to them;
- anything about nginx, because this suite never loads the vhost. The redirect,
  ACME and fallback behaviour is covered by the vhost validation below, but on a
  throwaway nginx rather than the production host — so the real certificate, the
  real Bells portal on 3100 and the live TLS configuration remain unproven here;
- that the certificate renews (only `certbot renew --dry-run` on the host
  proves that).

### The vhost validation

`deploy/tests/run-nginx-validation.sh` answers the question the activation tests
cannot: *does `deploy/nginx/ggitech.conf` actually behave the way the runbook
says it does?* It runs a real nginx, with the vhost installed **unmodified**, and
drives it with `curl`.

Keeping the artefact unmodified is the whole design. The file hard-codes
`/var/www/ggitech-acme`, `/etc/letsencrypt/live/ggitech.dev` and
`/var/log/nginx/ggitech*.log`, so rather than rewrite those paths — which would
mean testing a file that is not the one that ships — the suite stands them up for
real on a disposable host: a self-signed certificate carrying both
`DNS:ggitech.dev` and `DNS:www.ggitech.dev`, an ACME token under the webroot, and
a throwaway upstream on `127.0.0.1:3213` that records the request headers it
receives. The only claim made about the file itself is that the installed copy is
byte-identical to the one in the repository.

```bash
# On a scratch Linux VM or container, as root. Needs nginx, openssl, curl and
# python3. This is not the activation suite; it never touches /var/www/ggitech.
sudo deploy/tests/run-nginx-validation.sh
```

**What it asserts:** that the installed copy is byte-identical; that `nginx -t`
passes and warns about nothing; that no directive in the file names the Bells
portal or port 3100; that `http://ggitech.dev/...`, `http://www.ggitech.dev/...`
and `https://www.ggitech.dev/...` each answer `301` to
`https://ggitech.dev/services?utm_source=x&utm_medium=email` — path *and* query
string preserved, and the www target not itself naming www, which is what would
make the redirect loop; that the apex answers `200` with no redirect and is
proxied to the upstream, carrying `host=ggitech.dev`, `xfp=https` and a
`127.0.0.1` client address; that the ACME challenge returns the token for both
names; that a refused upstream is answered by the fallback with `Retry-After`,
and not by the stock nginx error document; and that the 443 socket still
negotiates HTTP/2 (section 7 below).

#### The 443 listening socket, and the protocol-option warning

On nginx 1.24 the `http2` parameter on `listen` is not a property of a `server`
block: it is a protocol option of the **listening socket**, and every HTTPS
virtual host on the host shares the one socket for `443`. Declaring a
*different* set of options for the same address from a second block is what
nginx calls a redefinition, and since 1.24 it warns:

```
nginx: [warn] protocol options redefined for 0.0.0.0:443 in /etc/nginx/sites-enabled/…:200
```

The warning was reported at the second GGITECH HTTPS block — the www block —
because the Bells portal vhost claims the same socket with a shorter set
(`listen 443 ssl;`), the apex block then declared `ssl http2`, and the www block
repeated `ssl http2`. Three declarations, two different sets, one socket.

`ssl` on its own is the case nginx *does* allow: options may be repeated for
clarity as long as the repeat is a subset of the socket's, which is what the
apex block already established. So the www block now declares `listen 443 ssl;`
— no `http2` — and the warning is gone. Nothing about HTTP/2 changes, because
the option the socket uses is the union of everything declared for it: the apex
block's `http2` is still in effect for every host on the socket, so
`https://ggitech.dev`, `https://www.ggitech.dev` **and** the portal all still
negotiate h2. The portal's own configuration is not touched, and HTTP/2 support
is not reduced.

Section 7 of `run-nginx-validation.sh` proves this rather than asserting it. It
stands up a fixture vhost that reproduces only the portal's `listen` line
(loading before the GGITECH vhost, as on the server) and then:

1. reinstates `http2` on the www listeners, byte-for-byte the form that was
   shipped before this change, and asserts the warning reappears and names
   `0.0.0.0:443`;
2. installs the shipped file with the same fixture loaded and asserts zero
   protocol-option warnings;
3. asserts `%{http_version}` is `2` for `ggitech.dev`, `www.ggitech.dev` and
   `certificate.bellsuniversity.edu.ng`, and that the portal still answers `200`
   on the shared socket.

The fixture is a stand-in, not the portal: the suite never reads, writes or
modifies the portal's configuration, and the fixture is removed on exit.

#### Execution status

Executed in a disposable `ubuntu-24.04` GitHub Actions runner
(nginx/1.24.0). It has **never been run on the DigitalOcean host**, and the
production nginx configuration was not read or written by it. A passing run ends
by re-asserting `git diff --exit-code -- deploy/nginx/ggitech.conf`, so it also
proves the vhost was not edited to make itself pass.

The suite as it stands — the canonical-domain assertions plus section 7 —
reports **36 assertions passed, 0 failed**, and the warning is reproduced and
then eliminated inside the one run:

| Step | Observed |
| --- | --- |
| The pre-fix form (`http2` on the www listeners) | `[warn] protocol options redefined for 0.0.0.0:443 in /etc/nginx/sites-enabled/ggitech:223` |
| The shipped form, same portal fixture loaded | no protocol-option warning, and `nginx -t` still accepts it |
| `https://ggitech.dev`, `https://www.ggitech.dev`, `https://certificate.bellsuniversity.edu.ng` | `%{http_version}` is `2` for all three |
| The portal's stand-in on the shared socket | answers `200` |

The nginx on that runner is `nginx/1.24.0 (Ubuntu)` — the same version as
production, and the version that introduced the warning.

An earlier version of the suite, before section 7 existed, passed 23 assertions
and failed 4. All four were defects in the test, not in the vhost, and the vhost
was left unchanged:

| Failure | Cause | Correction |
| --- | --- | --- |
| The ACME token was compared as `acme-token-ok\n` | The fixture wrote the token through `printf '%s\n'`; nginx serves the file byte for byte | The fixture writes it with `printf '%s'`, with no trailing newline |
| Two assertions expected `503` for a refused upstream, and one missed `Retry-After: 3` | The fallback really does answer `502`, and HTTP/2 lower-cases response header names | The test now asserts `502` and folds the header dump before matching; the two runbook claims that had said `503` were corrected to describe what nginx does |

The corrected suite of that time then reported 28 assertions passed, 0 failed.
Section 7 was added on top of it, which is where the 36 above comes from.

The status is `502` because `error_page 502 @unavailable;` — without the `=` form
— redirects the response *body* to the named location but keeps the code nginx
raised. Only `error_page 502 = @unavailable;` would let the location's own `503`
reach the client. The shipped configuration was deliberately **not** changed to
add the `=`, because the repository is meant to mirror production, not to
redefine it.

### First-deployment test plan

Run on the server, in order, before enabling automatic deployment.

1. Complete installation steps 1–7 and run the read-only verification block.
   Confirm `nginx -t` passes on the **existing** vhosts, `sudo -l -U deploy`
   lists one command, the service is enabled but not active,
   `certbot renew --dry-run` succeeds, and `https://ggitech.dev` is still being
   served by the configuration that was already on the host.
2. Record the pre-deployment state, so the first activation has a "before" to
   compare against:

   ```bash
   sudo /usr/local/bin/ggitech-activate --status     # expect: active=<empty>, verified=no
   ls -A /var/www/ggitech/releases/                  # expect: empty
   ss -lntp | grep 3213 || echo "nothing listening yet"
   ```

3. Trigger the workflow with **Deploy to production** (`workflow_dispatch`) and
   watch it. Expect: quality and audit jobs pass, the artifact is uploaded, the
   activation reports exit `0`, and the run reports the release is live.
4. Verify independently, without trusting the workflow. Step 9 has not run yet,
   so every check here is on loopback and the public site is still the old one:

   ```bash
   curl -fsS http://127.0.0.1:3213/api/health     # status ok, release = the deployed SHA
   sudo /usr/local/bin/ggitech-activate --status  # verified=yes
   curl -fsS http://127.0.0.1:3100/ -o /dev/null -w '%{http_code}\n'   # Bells portal still up
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

7. Only now do step 9 (replace the vhost) and step 10, and confirm the public
   site and the portal together:

   ```bash
   curl -fsS -o /dev/null -w 'https=%{http_code}\n' https://ggitech.dev/
   curl -fsS -o /dev/null -w 'bells=%{http_code}\n' http://127.0.0.1:3100/
   sudo nginx -t
   sudo grep -rl 'ggitech\.dev' /etc/nginx/sites-enabled/ | wc -l    # 1
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

- nginx replaces its own unbranded error document with a short, honest message
  and `Retry-After: 3`. The status stays `502`, which is what nginx raised for a
  refused upstream: `error_page 502 @unavailable;` redirects the body to the
  named location but keeps the original code, and only the `=` form
  (`error_page 502 = @unavailable;`) would let the location's own `503` reach
  the client. Verified against nginx 1.24 by
  `deploy/tests/run-nginx-validation.sh`;
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
- **Outbound email is server-addressed.** The notification recipient comes from
  the environment, never from a request field, and a customer-supplied address
  can only ever reach `Reply-To`. Both form endpoints additionally gate on
  same-origin, carry a honeypot, and are length- and rate-limited, so neither
  route can be used as a mail relay. Nothing about email is logged beyond a
  reference number and a non-sensitive reason code.
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

- **On nginx 1.25.1 and newer the `http2` parameter on `listen` is deprecated**
  in favour of a bare `http2 on;` directive, and nginx warns about the old form.
  Production is 1.24.0, where the parameter is the only form available, so the
  vhost uses it. After a host upgrade the apex block's two `listen ... http2`
  lines should lose the parameter and gain `http2 on;` — and the same
  socket-level reasoning applies to the warning that replaces this one, so do
  not simply move the parameter to the www block.
- **The two applications share one HTTPS socket, and that is not optional.** A
  client that asks for `certificate.bellsuniversity.edu.ng` on 443 lands on the
  same socket as `ggitech.dev`; the vhosts are told apart by SNI and
  `server_name`, not by separate listeners. Anything that changes the protocol
  options for that socket therefore changes them for the portal too, which is
  why the portal's file must not be edited to chase a warning originating here.
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
  change. The duplicate-submission guard has the same lifetime, so a repeated
  click spanning a deploy is not recognised as a duplicate.
- **Email confirmation stops at the provider boundary.** A Resend message id means
  the message was *accepted for delivery*, not delivered. There is no webhook
  receiver and no durable enquiry record, so a bounce or a spam filing shows up
  only in the Resend dashboard. If Resend is unreachable the visitor is told the
  submission failed rather than being queued — there is no store-and-forward.
  Both behaviours are deliberate: a database was out of scope for this change.
- `npm audit --omit=dev` reports four low-severity advisories from
  `@react-email/render` → `html-to-text`. CI gates at `--audit-level=high`, so
  they do not block a release; they are recorded here rather than ignored.
