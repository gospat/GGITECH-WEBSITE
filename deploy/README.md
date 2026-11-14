# GGITECH production deployment

Everything needed to run `https://ggitech.dev` on the DigitalOcean host, and to
deploy to it from GitHub Actions without a human logging in.

This host also runs the **Bells University certificate verification portal** on
port 3100. Nothing in this directory touches that application: it has its own
systemd unit, its own nginx `server` block and its own database. The single
shared resource is the nginx process itself, and adding a vhost to it is a
graceful reload.

---

## Contents

| Path | What it is |
| --- | --- |
| `.github/workflows/deploy-production.yml` | Validate, build, transfer, activate, verify, roll back |
| `.github/workflows/ci.yml` | Formatting, lint, typecheck, build, dependency audit on every PR |
| `app/api/health/route.ts` | Readiness endpoint the pipeline and the activator poll |
| `deploy/bin/ggitech-activate` | Root-owned activation script — the only privileged command `deploy` may run |
| `deploy/sudoers/ggitech-activate` | The single sudoers rule that grants it |
| `deploy/systemd/ggitech.service` | The application service |
| `deploy/nginx/ggitech.conf` | Reverse proxy for `ggitech.dev` |

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
       ├─ transfer   rsync → deploy@host:/home/deploy/uploads/<sha>
       ├─ activate   sudo ggitech-activate <sha>
       │               stage upload → validate → promote → swap symlink
       │               → restart service → poll /api/health for <sha>
       │               → smoke-test the homepage → prune → record state
       │               on any failure: roll back internally, exit non-zero
       ├─ rollback   only if activation failed: `--rollback`, then re-check
       │             /api/health independently. Reports ROLLBACK FAILED rather
       │             than claiming a recovery that did not happen.
       └─ always     discard an incomplete upload, report final state, delete the key
```

The build happens **once**. The exact tarball that passed validation is the one
that is deployed; the deploy job never rebuilds.

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

## One-time server setup

Run all of this as `admin` (or any sudo-capable account) — never as `deploy`.
Run it from a checkout of this repository on the server, or copy the four files
across first.

> **Do not start step 5 until a release exists.** The unit's
> `WorkingDirectory=/var/www/ggitech/current` does not resolve until the first
> successful activation, so `systemctl start` before then fails.

### 1. Application tree

```bash
sudo install -d -o root -g root -m 0755 /var/www/ggitech
sudo install -d -o root -g root -m 0755 /var/www/ggitech/releases
sudo install -d -o root -g root -m 0755 /var/www/ggitech/state
sudo install -d -o root -g ggitech -m 0750 /var/www/ggitech/shared
sudo install -d -o root -g root -m 0750 /var/log/ggitech
```

### 2. Production secrets

The secrets live here and are never copied into a release, so rolling back
cannot resurrect a stale credential set.

```bash
sudo install -m 0640 -o root -g ggitech /dev/null /var/www/ggitech/shared/.env.production
sudoedit /var/www/ggitech/shared/.env.production
```

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

```bash
sudo install -o root -g root -m 0644 deploy/systemd/ggitech.service /etc/systemd/system/ggitech.service
sudo systemctl daemon-reload
sudo systemctl enable ggitech.service
```

Do not start it yet. The first deployment starts it.

### 6. The reverse proxy

Check the certificate lineage name first — the vhost assumes `ggitech.dev`:

```bash
sudo ls -1 /etc/letsencrypt/live/
```

If it differs, edit **only** the two `ssl_certificate` lines in
`deploy/nginx/ggitech.conf`. Do not re-issue the certificate.

```bash
sudo install -o root -g root -m 0644 deploy/nginx/ggitech.conf /etc/nginx/sites-available/ggitech.conf
sudo ln -sfn /etc/nginx/sites-available/ggitech.conf /etc/nginx/sites-enabled/ggitech.conf
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` validates the whole configuration including the portal's vhost, so a
mistake here is caught before anything is reloaded. `reload` is graceful: in-
flight connections, including the portal's, are served by the old workers until
they finish.

If the certificate was issued with certbot's nginx plugin rather than
`--webroot`, leave the `/.well-known/acme-challenge/` block as it is and keep
renewing the same way. Both mechanisms coexist.

### 7. The upload directory

```bash
sudo install -d -o deploy -g deploy -m 0700 /home/deploy/uploads
```

The existing SSH connection test asserts this directory exists, and the
workflow uploads into it. It is the only path outside `/var/www/ggitech` that
the activation script reads from, and it is never read before the upload is
re-owned and re-validated.

### 8. Verify before the first deploy

```bash
sudo visudo -c                                        # sudoers file parses
sudo -l -U deploy                                     # exactly one command
sudo systemd-analyze verify /etc/systemd/system/ggitech.service
sudo nginx -t
sudo -u deploy ssh -o BatchMode=yes localhost true    # deploy can SSH out (not required)
test -f /var/www/ggitech/shared/.env.production && echo "env file present"
grep -c . /var/www/ggitech/shared/.env.production      # non-empty
```

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
health before exiting non-zero. The workflow then runs `--rollback` as a second
opinion and verifies `/api/health` itself. If even that fails, the job reports
`ROLLBACK FAILED` and production needs a human.

**2. Restore the last good release.**

```bash
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate --rollback'
```

This restores `state/active` — the last release that *passed* activation — not
`state/previous`, which is one revision further back. Use it when a run was
interrupted after the symlink moved but before the health check.

**3. Re-activate a specific release that is still on disk.**

```bash
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate <sha>'
ls -1 /var/www/ggitech/releases/          # candidates, newest last
```

Only the last five releases are kept. Re-activating an older one re-runs the
full validation, restart, health check and smoke test.

**Recovering from a cancelled run.** If a deployment is cancelled between the
symlink swap and the health check, `current` may point at an unverified
release. The lock is released as soon as the process exits, so:

```bash
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate --status'
ssh deploy@<host> 'sudo -n /usr/local/bin/ggitech-activate --rollback'
ssh deploy@<host> 'curl -fsS http://127.0.0.1:3213/api/health'
```

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
| exit `6`, "the health check failed" | App started but is unhealthy | `journalctl -u ggitech -n 80` — the activator already printed this |
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
- **Path traversal is structurally impossible.** The only input is a release
  id, which must match `^[0-9a-f]{40}$`. Every path is derived from it; nothing
  caller-supplied reaches a path or a shell unquoted. Releases are re-resolved
  with `realpath -e` and rejected unless their parent is exactly
  `/var/www/ggitech/releases`. Symlinked releases, staging paths and upload
  paths are all refused.
- **The upload is untrusted.** Anything written by `deploy` is re-owned to
  `root:root` and re-permissioned before it is promoted, so planted setuid bits
  or a writable release tree cannot survive.
- **Secrets never move.** Production credentials live only in
  `/var/www/ggitech/shared/.env.production` (`0640 root:ggitech`) and are never
  copied into a release, so a rollback cannot resurrect an old credential set.
  The workflow never reads them and never prints them.
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
- Deployments are serialised by the `production-deploy` concurrency group. A
  second push queues rather than racing, and a queued run deploys its own commit
  when it starts.
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
