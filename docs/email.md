# Email

The website sends every notification through the **Resend HTTPS API**. There is no SMTP
transport: the previous nodemailer configuration was removed rather than kept as a
fallback, so there is exactly one code path to reason about.

Two forms send mail, and both use the same service:

| Form | Route | Notification subject |
| --- | --- | --- |
| `/contact` | `app/api/contact/route.ts` | `[GGITECH] New Project Enquiry — {Customer Name}` |
| `/project-brief` | `app/api/project-brief/route.ts` | `[GGITECH] New Project Enquiry — {Customer Name}` |

There is no quotation or consultation form, so nothing else was added.

---

## 1. What a submission does

1. The route rejects cross-site requests, then the honeypot field, then the rate limit.
2. Input is validated and coerced in `lib/validation.ts` — the same code the forms use.
3. A reference number is generated (`GGI-YYMMDD-XXXXXX`, Crockford base32, no `I`, `L`,
   `O` or `U`, so it is unambiguous when read aloud).
4. The **internal notification** is rendered and sent to `CONTACT_NOTIFICATION_EMAIL`,
   with the customer's address as `Reply-To` and, for `/project-brief`, the generated PDF
   attached.
5. If that succeeded, the **customer acknowledgement** is rendered and sent, unless
   `CONTACT_AUTO_REPLY_ENABLED` is `false`.

**The notification is fatal and the acknowledgement is not.** If the notification is
rejected, the visitor gets an error and no acknowledgement is sent — a person is never told
their enquiry was received when the team's copy was refused. If the acknowledgement fails
after a successful notification, the enquiry is still reported as received and the failure
is logged.

### What "sent" means

Resend answering with a message id means the provider has **accepted** the message for
delivery. It does not mean it was delivered: the receiving mailbox can still bounce, defer
or file it as spam. Nothing in the site claims otherwise, and the acknowledgement says
plainly that it is an automatic confirmation rather than implying a person has read it.

Confirmed delivery would need a Resend webhook and somewhere durable to record the event.
This deployment has neither, so it does not claim delivery.

### What happens when sending fails

There is no store-and-forward. If Resend is unreachable, times out (10 s ceiling), or
rejects the message, the visitor is told the submission failed and is given a direct email
address to use instead. The alternative — accepting the message and hoping — would mean
telling someone their enquiry was received when no copy of it exists anywhere.

---

## 2. Configuration

All five values are **server-side only**. Never prefix a Resend value with `NEXT_PUBLIC_`;
anything so named is compiled into the browser bundle.

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Resend API key. Creating it requires a verified domain with sending permission. |
| `RESEND_FROM_EMAIL` | yes | Verified sender. Either `notifications@ggitech.dev` or `GGITECH <notifications@ggitech.dev>`. |
| `CONTACT_NOTIFICATION_EMAIL` | yes | Where enquiry notifications are delivered. Internal only — never taken from a form field. |
| `CONTACT_REPLY_TO_EMAIL` | no | `Reply-To` on the customer acknowledgement. Defaults to `CONTACT_NOTIFICATION_EMAIL`. |
| `CONTACT_AUTO_REPLY_ENABLED` | no | `true` (default), `false`, `1`/`0`, `yes`/`no`, `on`/`off`. |

`TRUSTED_PROXY_HOPS` (default `1`) also matters here: it is how the rate limiter decides
which entry in `X-Forwarded-For` is real, so a forged header cannot buy a fresh bucket.

### Runtime, not build time

`lib/server/email/config.ts` reads these lazily, inside `getEmailEnv()`, which is called
only when someone submits a form. Nothing is read during `next build`. Consequences:

- CI and a production build need **no** email credentials and must never be given any.
- The site, its pages and `/api/health` serve normally even if the values are missing.
- A submission on a misconfigured deployment fails **closed**: HTTP `503` with a generic
  message, and a server-side log line naming the missing variable.

Production values live in `/var/www/ggitech/shared/.env.production` (`0640
root:ggitech`). See `deploy/README.md` §"Production secrets" for the file handling rules.

---

## 3. Verifying `ggitech.dev` with Resend

**Nothing here is verified yet.** Until the steps below are done, submissions fail with a
provider rejection and the integration must not be described as operational.

### The records Resend will ask you to create

Resend issues the values per domain and per account: the DKIM key, the bounce host and the
region-specific endpoints are all yours alone. **This document therefore does not print a
single record value**, and no value here should ever be copied from anywhere but your own
Resend dashboard. A token guessed from documentation is a token that does not verify.

Open **Resend → Domains → Add Domain**, enter `ggitech.dev`, and create exactly the records
it shows. By purpose, they are:

1. **DKIM** — a `TXT` record on a `resend._domainkey.…` name holding a long public key.
   This is what lets receivers verify the signature on your messages. It is the one record
   that must be copied exactly and in full.
2. **SPF** — a `TXT` record carrying a single `v=spf1 …` policy for the **sending**
   subdomain.
3. **Bounce/return-path** — an `MX` record on the same sending subdomain, pointing at
   Resend's feedback host for your region.

Resend's default layout scopes the SPF and MX records to a `send.ggitech.dev` subdomain
rather than the root domain. **Confirm the names it shows you and use those.** This
scoping is the point: it is why adding these records leaves the mailboxes and the existing
mail routing on `ggitech.dev` completely untouched.

### Do not overwrite existing mail records

- **Do not delete or edit existing `MX` records** for `ggitech.dev`. They route your
  current mail and have nothing to do with Resend.
- **Do not replace an existing SPF record** on the root or on any host you already send
  from. Adding a second `v=spf1` record on the same name breaks SPF for everything on it.
  If a name already has an SPF record, stop and reconcile the two by hand.
- `ggitech.dev` may also publish a DMARC record. Leave it in place. If it is set to
  `p=reject` and the DKIM record is not yet live, mail will fail — so verify DKIM first
  and only then tighten DMARC.

If anything in the dashboard conflicts with a record that already exists, resolve it
deliberately rather than clicking through.

### Checking propagation

DNS is usually live within minutes but can take hours. Check before pressing verify:

```bash
# DKIM: substitute the exact host Resend shows you
dig +short TXT resend._domainkey.ggitech.dev

# SPF on the sending subdomain: exactly one v=spf1 record must come back
dig +short TXT send.ggitech.dev

# Return path: the MX target Resend shows you
dig +short MX send.ggitech.dev

# Confirm the root domain's mail routing is unchanged
dig +short MX ggitech.dev
```

Then press **Verify** in Resend. A domain shows as verified only when DKIM and the sending
records all pass.

### Sending from `ggitech.dev` does not create a mailbox

This is the easy one to get wrong. Verifying the domain authorises Resend to **send as**
`notifications@ggitech.dev`. It does not create that mailbox and does not make it
receivable:

- Mail sent **from** `notifications@ggitech.dev` works and keeps the brand in the inbox.
- Mail sent **to** `notifications@ggitech.dev` will bounce, because no mailbox exists.
- Reply routing therefore does not depend on it. The notification sets the customer's own
  address as `Reply-To`, so replying from the team's mail client reaches the customer; the
  acknowledgement sets `CONTACT_REPLY_TO_EMAIL`, so a reply reaches the team.

### Separate recommendation: create real mailboxes

If you want `info@ggitech.dev` or `hello@ggitech.dev` to appear as contact addresses — on
the website, in the email footer, on invoices — **create them as real mailboxes with your
mail host first.** A Resend-verified domain will happily send from an address that cannot
receive, which produces silent bounces. Until such a mailbox exists and has been tested,
do not publish the address. That is why the email templates currently print only the
website URL, the registered company name and Lagos as the location.

---

## 4. Verifying end to end

After the domain is verified and the key is in `.env.production`:

1. Restart the service so systemd re-reads the environment file:
   `sudo systemctl restart ggitech`
2. Confirm the site is up: `curl -fsS http://127.0.0.1:3213/api/health`
3. Submit the `/contact` form with an address **you control**.
4. Confirm the notification arrived at `CONTACT_NOTIFICATION_EMAIL`, that `Reply-To` is the
   address you submitted, and that replying from it addresses that person.
5. Confirm the acknowledgement arrived at the address you submitted, and that its `Reply-To`
   is `CONTACT_REPLY_TO_EMAIL`.
6. Submit `/project-brief` and confirm the PDF attachment is on the notification **only**.
7. Check the reference number shown on the success panel matches the one in both emails.
8. Watch the journal while doing this:

   ```bash
   sudo journalctl -u ggitech -f --output cat | grep '"source":"email"'
   ```

A green deploy proves the build compiled, not that the key works. Only a real controlled
submission does that.

---

## 5. Changing the templates

The templates are React components, which is what keeps the HTML and its plain-text
alternative generated from one source.

```
components/email/
├── theme.ts              palette, spacing, the email-safe font stack
├── Typography.tsx        Heading / Text / SectionHeading / Label
├── EmailLayout.tsx       document shell: html, body, the colour-scheme meta tags
├── EmailHeader.tsx       dark brand bar with the HTTPS logo and alt text
├── EmailFooter.tsx       legal name, location, website, reason for receiving
├── SectionCard.tsx       light bordered card that wraps a group of fields
├── DetailList.tsx        label/value rows, with `mono` for the reference number
├── Divider.tsx, CallToAction.tsx
├── templates/
│   ├── EnquiryNotification.tsx      the team's copy — every submitted field
│   └── EnquiryAcknowledgement.tsx   the customer's copy — a summary only
└── index.ts               subjects, preheaders and the re-export barrel
```

Everything the templates render is derived from `lib/server/email/enquiry.ts`, where
`buildContactEnquiry` and `buildProjectBriefEnquiry` map validated form data onto a
`EnquiryEmailData`. **To add a field, add it there first**, then render it in the template.

Rules that are easy to break:

- **Only show fields the form actually collects.** A field the customer left blank must be
  omitted entirely, not rendered as an empty row. `addIf` exists for this.
- **Never render submitted HTML as trusted.** There is no `dangerouslySetInnerHTML`
  anywhere in `components/email/`. React escapes text nodes, so a message containing
  `<script>` arrives as visible text. Keep it that way.
- **Keep line breaks.** Long free-text fields use `white-space: pre-wrap`.
- **Inline styles only.** No external stylesheet, no `<script>`, no web font. Clients strip
  them. The font stack is a system stack because the site's `next/font/local` faces have no
  public URL to link to.
- **The acknowledgement stays a summary.** It never echoes the full project brief back.
- **No external images except the logo**, which is served over HTTPS from
  `https://ggitech.dev/brand/icon-512.png` and carries alt text.
- **Do not invent company details.** No address, phone number or social link is printed
  unless it is a verified business fact.
- **Update the tests.** `tests/email-templates.test.ts` asserts subjects, escaping, blank-field
  omission, the absence of internal metadata and the absence of any response-time promise.

### Previewing locally

```bash
npm run preview:email
```

This renders all four combinations — contact and brief, notification and acknowledgement —
to `.email-preview/` as `.html` and `.txt`. Open the HTML files in a browser and the `.txt`
files beside them to check the plain-text alternative. The directory is git-ignored.

The script refuses to run when `NODE_ENV=production`, uses fictional sample data only, and
reads **no** email environment variable — so previewing never needs a key and never contacts
Resend. It deliberately includes hostile sample data (`<script>`, a bare `<img>`, accented
characters, currency symbols) so escaping problems are visible rather than latent.

Rendering happens locally, so nothing is sent. Screenshots of the preview are the intended
evidence for review.

---

## 6. Logs

One JSON object per line, matching `instrumentation.ts`, on stdout/stderr:

| Event | Level | Meaning |
| --- | --- | --- |
| `enquiry.notification_accepted` | info | Resend accepted the team's copy. Carries `providerMessageId` and `durationMs`. |
| `enquiry.notification_failed` | error | The team's copy was not accepted. The visitor was told the submission failed. |
| `enquiry.acknowledgement_accepted` | info | Resend accepted the customer's copy. |
| `enquiry.acknowledgement_skipped` | info | `CONTACT_AUTO_REPLY_ENABLED` is false. |
| `enquiry.acknowledgement_failed` | error | The acknowledgement failed after a successful notification. Tolerated. |

Every line carries `form` and `reference`. `reason` is a short label — `timeout`,
`network_error`, a Resend error code such as `daily_quota_exceeded`, or
`config:Missing required environment variable: …`.

Deliberately never logged: the API key, message bodies, the customer's email address, and
raw provider response text (a provider message can quote the request it rejected). Enquiries
are traced by reference number instead.

### Symptom → cause

| What you see | Likely cause |
| --- | --- |
| `503`, `reason: "config:Missing required environment variable: …"` | The variable is absent or blank in `.env.production`, or the service was not restarted after editing it. |
| `502`, `reason: "invalid_from_address"` | `RESEND_FROM_EMAIL` is on a domain Resend has not verified, or the key lacks sending permission. |
| `502`, `reason: "validation_error"` | A header value is malformed, or a value contains a line break. |
| `502`, `reason: "daily_quota_exceeded"` / `monthly_quota_exceeded` | Resend plan limit. Not a code problem. |
| `502`, `reason: "timeout"` | Resend did not answer within 10 s. |
| `502`, `reason: "network_error"` | DNS, outbound egress or TLS to `api.resend.com` is blocked on the host. |
| `reason: "unexpected_error"` | The template failed to render. Check the deploy for a broken template change. |
| Notification arrives, no acknowledgement | Check for `enquiry.acknowledgement_failed`, then `CONTACT_AUTO_REPLY_ENABLED`. |
| Nothing arrives, no log line | The request never reached the route — check nginx access logs and the rate limiter. |

Rate limits, per client, per hour: 5 for `/contact`, 3 for `/project-brief`. Both routes also
reject a second identical submission within 2 minutes and answer it with the **original**
reference number rather than sending twice. That guard lives in memory, so it resets on
deploy; the rate limit is the durable control.

---

## 7. Deliberately not implemented

- **No database.** No enquiry is stored. The reference number is generated per submission
  and appears in both emails, but there is no record to look it up in — nothing claims
  otherwise. Adding storage means a migration, a retention policy and a privacy review; that
  is a separate decision, not a side effect of this integration.
- **No CAPTCHA.** The honeypot, the same-origin gate, the length limits and the rate limit
  cover the realistic abuse for a form that only sends mail. A managed CAPTCHA would add a
  third-party dependency and a script on the page; revisit if spam actually appears.
- **No delivery webhooks.** See §1.
- **No retry queue.** A failed submission is retryable by the visitor, which is the honest
  behaviour when there is nowhere to store it.
