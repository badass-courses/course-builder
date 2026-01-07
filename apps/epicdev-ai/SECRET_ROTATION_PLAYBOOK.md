# Secret Rotation Playbook - CVE-2025-55182 Response

> **For Claude**: This is an executable runbook for rotating secrets after a
> security incident. Follow it precisely, phase by phase. Ask the human for each
> secret value - never guess or fabricate credentials. Use `printf '%s'` not
> `echo` to avoid whitespace corruption.

**CVE**: RCE in React Server Components (CVSS 10.0)  
**Advisory**: https://github.com/vercel/next.js/security/advisories/GHSA-9qr9-h5gf-34mp

---

## Critical Rules

1. **NEVER use `echo` to pipe secrets to Vercel CLI** - it adds a trailing
   newline that corrupts env vars. Always use `printf '%s'`:

   ```bash
   # WRONG - adds \n to the value, breaks everything
   echo "secret" | vercel env add VAR production

   # CORRECT - no trailing newline
   printf '%s' "secret" | vercel env add VAR production
   ```

2. **DO NOT commit actual secrets to this file** - repo is public.

3. **Verify after adding** - pull and check for `\n` contamination:

   ```bash
   vercel env pull .env.check --yes
   grep "VAR_NAME=" .env.check  # should NOT end with \n"
   rm .env.check
   ```

4. **Ask the human for each secret** - they will generate/retrieve from provider
   dashboards. Never fabricate values.

5. **One phase at a time** - deploy and verify after critical phases (auth, DB,
   payments) before continuing.

---

## Lessons Learned

1. **Vercel project names don't always match folder names** - epicdev-ai folder
   → epicai-pro project. Always verify with
   `vercel link --project NAME --scope TEAM --yes`.

2. **MUX has 3 env vars** - MUX_ACCESS_TOKEN_ID, MUX_SECRET_KEY,
   MUX_WEBHOOK_SIGNING_SECRET. Don't forget the token ID.

3. **Inngest has 2 keys** - INNGEST_SIGNING_KEY and INNGEST_SIGNING_KEY_FALLBACK
   for graceful rotation.

4. **ConvertKit legacy API has no rotation** - V4 can be rotated; legacy
   CONVERTKIT_API_KEY/CONVERTKIT_API_SECRET invalidate immediately.

5. **Shared resources require coordination** - KCD apps share PlanetScale,
   Stripe, ConvertKit. Create new credentials, update ALL apps, then delete old.

6. **SKILL_SECRET** - Product database row ID from support database. Format:
   `sks_<uuid>`. Used for x-skill-secret header auth.

7. **Priority order** - Auth → DB → Payments → AI/Media → Infrastructure → Misc.
   Low-stakes secrets (Typesense, Upstash, Axiom, Discord, Slack) can wait.

8. **Lost accounts happen** - If you can't find which account owns a service
   (e.g., Upstash), note the identifier and skip.

---

## Setup

```bash
# Navigate to app folder
cd /path/to/apps/APP_FOLDER_NAME

# Link to Vercel project (name may differ from folder!)
vercel link --project PROJECT_NAME --scope skillrecordings --yes

# Verify
vercel env ls production
```

**Known mappings**: | Folder | Vercel Project | Team |
|--------|----------------|------| | epicdev-ai | epicai-pro | skillrecordings |
| epic-web | epic-web-builder | skillrecordings | | epic-react |
epic-react-builder | skillrecordings |

---

## Phase 1: Auth (causes logout)

### NEXTAUTH_SECRET

```bash
# Generate
NEW_SECRET=$(openssl rand -base64 32)
echo "Generated: $NEW_SECRET"

# Update all envs
for ENV in production preview development; do
  vercel env rm NEXTAUTH_SECRET $ENV --yes 2>/dev/null
  printf '%s' "$NEW_SECRET" | vercel env add NEXTAUTH_SECRET $ENV
done
```

### GITHUB_CLIENT_SECRET

1. GitHub → Settings → Developer settings → OAuth Apps → select app
2. Generate new client secret (old works until deleted)
3. Update:

```bash
SECRET="<ask human for value>"
for ENV in production preview development; do
  vercel env rm GITHUB_CLIENT_SECRET $ENV --yes 2>/dev/null
  printf '%s' "$SECRET" | vercel env add GITHUB_CLIENT_SECRET $ENV
done
```

---

## Phase 2: Database (PlanetScale - zero downtime possible)

### DATABASE_URL

```bash
# 1. List databases
pscale database list

# 2. List current passwords
pscale password list DB_NAME main

# 3. Create new password
pscale password create DB_NAME main cve-rotation-$(date +%Y%m%d)
# Save output: username, password, host

# 4. Construct connection string
# mysql://USERNAME:PASSWORD@HOST/DB_NAME?sslaccept=strict

# 5. Update
DB_URL="<constructed URL>"
for ENV in production preview development; do
  vercel env rm DATABASE_URL $ENV --yes 2>/dev/null
  printf '%s' "$DB_URL" | vercel env add DATABASE_URL $ENV
done

# 6. Deploy and verify
# 7. AFTER verified - delete old password
pscale password delete DB_NAME main OLD_PASSWORD_ID
```

---

## Phase 3: Payments (critical)

### STRIPE_SECRET_TOKEN

```bash
# Stripe Dashboard: Developers → API Keys → Roll Secret Key
# (Old stays valid 24h)

SECRET="<ask human - starts with sk_live_>"
for ENV in production preview development; do
  vercel env rm STRIPE_SECRET_TOKEN $ENV --yes 2>/dev/null
  printf '%s' "$SECRET" | vercel env add STRIPE_SECRET_TOKEN $ENV
done
```

### STRIPE_WEBHOOK_SECRET

```bash
# Stripe: Developers → Webhooks → endpoint → Roll signing secret

SECRET="<ask human - starts with whsec_>"
for ENV in production preview development; do
  vercel env rm STRIPE_WEBHOOK_SECRET $ENV --yes 2>/dev/null
  printf '%s' "$SECRET" | vercel env add STRIPE_WEBHOOK_SECRET $ENV
done
```

---

## Phase 4: Email

### POSTMARK_KEY / POSTMARK_API_KEY

```bash
# Postmark: Servers → Select Server → API Tokens → Create new

TOKEN="<ask human>"
for VAR in POSTMARK_KEY POSTMARK_API_KEY; do
  for ENV in production preview development; do
    vercel env rm $VAR $ENV --yes 2>/dev/null
    printf '%s' "$TOKEN" | vercel env add $VAR $ENV
  done
done
```

### POSTMARK_WEBHOOK_SECRET

```bash
SECRET=$(openssl rand -base64 32)
echo "Generated: $SECRET"
# Update in Postmark webhook config if using HTTP Auth

for ENV in production preview development; do
  vercel env rm POSTMARK_WEBHOOK_SECRET $ENV --yes 2>/dev/null
  printf '%s' "$SECRET" | vercel env add POSTMARK_WEBHOOK_SECRET $ENV
done
```

### CONVERTKIT

```bash
# WARNING: Legacy API has NO rotation - invalidates immediately
# Only rotate V4

V4_KEY="<ask human - starts with kit_>"
for ENV in production preview development; do
  vercel env rm CONVERTKIT_V4_API_KEY $ENV --yes 2>/dev/null
  printf '%s' "$V4_KEY" | vercel env add CONVERTKIT_V4_API_KEY $ENV
done
```

---

## Phase 5: AI/Media

### OPENAI_API_KEY

```bash
# platform.openai.com → API Keys → Create new

KEY="<ask human - starts with sk-proj->"
for ENV in production preview development; do
  vercel env rm OPENAI_API_KEY $ENV --yes 2>/dev/null
  printf '%s' "$KEY" | vercel env add OPENAI_API_KEY $ENV
done
# Revoke old key after deploy verified
```

### DEEPGRAM_API_KEY

```bash
# console.deepgram.com → Settings → API Keys → Create

KEY="<ask human>"
for ENV in production preview development; do
  vercel env rm DEEPGRAM_API_KEY $ENV --yes 2>/dev/null
  printf '%s' "$KEY" | vercel env add DEEPGRAM_API_KEY $ENV
done
```

### MUX (3 variables)

```bash
# dashboard.mux.com → Settings → API Access Tokens → Generate new
# Provides BOTH token ID and secret

TOKEN_ID="<ask human>"
SECRET="<ask human>"

for ENV in production preview development; do
  vercel env rm MUX_ACCESS_TOKEN_ID $ENV --yes 2>/dev/null
  vercel env rm MUX_SECRET_KEY $ENV --yes 2>/dev/null
  printf '%s' "$TOKEN_ID" | vercel env add MUX_ACCESS_TOKEN_ID $ENV
  printf '%s' "$SECRET" | vercel env add MUX_SECRET_KEY $ENV
done

# Webhook: Settings → Webhooks → select → Signing secret
WEBHOOK_SECRET="<ask human>"
for ENV in production preview development; do
  vercel env rm MUX_WEBHOOK_SIGNING_SECRET $ENV --yes 2>/dev/null
  printf '%s' "$WEBHOOK_SECRET" | vercel env add MUX_WEBHOOK_SIGNING_SECRET $ENV
done
```

### CLOUDINARY

```bash
# console.cloudinary.com → Settings → Access Keys → Generate new

API_KEY="<ask human>"
API_SECRET="<ask human>"

for ENV in production preview development; do
  vercel env rm CLOUDINARY_API_KEY $ENV --yes 2>/dev/null
  vercel env rm CLOUDINARY_API_SECRET $ENV --yes 2>/dev/null
  printf '%s' "$API_KEY" | vercel env add CLOUDINARY_API_KEY $ENV
  printf '%s' "$API_SECRET" | vercel env add CLOUDINARY_API_SECRET $ENV
done
```

---

## Phase 6: Infrastructure

### AWS Keys

```bash
# IAM Console: Users → select → Security credentials → Create access key
# Create new BEFORE deleting old

# Main keys
KEY_ID="<ask human - starts with AKIA>"
SECRET="<ask human>"

for ENV in production preview development; do
  vercel env rm AWS_ACCESS_KEY_ID $ENV --yes 2>/dev/null
  vercel env rm AWS_SECRET_ACCESS_KEY $ENV --yes 2>/dev/null
  printf '%s' "$KEY_ID" | vercel env add AWS_ACCESS_KEY_ID $ENV
  printf '%s' "$SECRET" | vercel env add AWS_SECRET_ACCESS_KEY $ENV
done

# Video upload keys (if different IAM user)
VID_KEY_ID="<ask human>"
VID_SECRET="<ask human>"

for ENV in production preview development; do
  vercel env rm AWS_VIDEO_UPLOAD_ACCESS_KEY_ID $ENV --yes 2>/dev/null
  vercel env rm AWS_VIDEO_UPLOAD_SECRET_ACCESS_KEY $ENV --yes 2>/dev/null
  printf '%s' "$VID_KEY_ID" | vercel env add AWS_VIDEO_UPLOAD_ACCESS_KEY_ID $ENV
  printf '%s' "$VID_SECRET" | vercel env add AWS_VIDEO_UPLOAD_SECRET_ACCESS_KEY $ENV
done
```

### INNGEST (2 keys)

```bash
# app.inngest.com → App → Settings → Signing Key → Rotate
# Provides both current and fallback

PRIMARY="<ask human - starts with signkey-prod->"
FALLBACK="<ask human - the previous key>"

for ENV in production preview development; do
  vercel env rm INNGEST_SIGNING_KEY $ENV --yes 2>/dev/null
  vercel env rm INNGEST_SIGNING_KEY_FALLBACK $ENV --yes 2>/dev/null
  printf '%s' "$PRIMARY" | vercel env add INNGEST_SIGNING_KEY $ENV
  printf '%s' "$FALLBACK" | vercel env add INNGEST_SIGNING_KEY_FALLBACK $ENV
done
```

### TYPESENSE

```bash
# cloud.typesense.org → Cluster → Generate API Key

READ_KEY="<ask human>"
WRITE_KEY="<ask human>"

for ENV in production preview development; do
  vercel env rm TYPESENSE_API_KEY $ENV --yes 2>/dev/null
  vercel env rm TYPESENSE_WRITE_API_KEY $ENV --yes 2>/dev/null
  printf '%s' "$READ_KEY" | vercel env add TYPESENSE_API_KEY $ENV
  printf '%s' "$WRITE_KEY" | vercel env add TYPESENSE_WRITE_API_KEY $ENV
done
```

### UPSTASH_REDIS_REST_TOKEN

```bash
# console.upstash.com → Database → REST API → Regenerate
# WARNING: Invalidates immediately

TOKEN="<ask human>"
for ENV in production preview development; do
  vercel env rm UPSTASH_REDIS_REST_TOKEN $ENV --yes 2>/dev/null
  printf '%s' "$TOKEN" | vercel env add UPSTASH_REDIS_REST_TOKEN $ENV
done
```

---

## Phase 7: Misc (lower priority)

### SKILL_SECRET

```bash
# Product database row ID from support DB
SECRET="sks_$(uuidgen | tr '[:upper:]' '[:lower:]')"
echo "Generated: $SECRET"

for ENV in production preview development; do
  vercel env rm SKILL_SECRET $ENV --yes 2>/dev/null
  printf '%s' "$SECRET" | vercel env add SKILL_SECRET $ENV
done
```

### AXIOM_TOKEN, DISCORD_BOT_TOKEN, SLACK_TOKEN, UPLOADTHING_TOKEN

```bash
# Same pattern for each:
VAR="VAR_NAME"
TOKEN="<ask human>"

for ENV in production preview development; do
  vercel env rm $VAR $ENV --yes 2>/dev/null
  printf '%s' "$TOKEN" | vercel env add $VAR $ENV
done
```

---

## Final Deploy & Verify

```bash
vercel --prod

# Checklist:
# [ ] Site loads
# [ ] Can log in (OAuth)
# [ ] Can purchase (Stripe)
# [ ] Webhooks work (check Stripe/Inngest dashboards)
# [ ] Video plays (Mux)
# [ ] Email sends (Postmark)
```

---

## Fixing Whitespace Corruption

If `echo` was used instead of `printf`:

```bash
# Pull current values
vercel env pull .env.fix --yes

# Fix each contaminated var
VAR="VAR_NAME"
VALUE=$(grep "^${VAR}=" .env.fix | sed 's/^[^=]*="//' | sed 's/\\n"$//' | sed 's/"$//')

for ENV in production preview development; do
  vercel env rm "$VAR" "$ENV" --yes 2>/dev/null
  printf '%s' "$VALUE" | vercel env add "$VAR" "$ENV"
done

rm .env.fix
```

---

## Rollback

```bash
vercel env rm BROKEN_VAR production --yes
printf '%s' "old-value" | vercel env add BROKEN_VAR production
vercel --prod
```

---

## Shared Resources (KCD)

**DO NOT COMMIT SECRETS - REPO IS PUBLIC**

### Stripe

- Shared across KCD apps
- Rolled keys expire 24h after rotation
- NOTE: "Epic Web Dev (FUCKED)" key needs investigation

### ConvertKit

- V4 can rotate, legacy cannot

### PlanetScale: kcd-products

- Password for CVE rotation: `cve-rotation-2025-12-05`
- Get connection string: `pscale password list kcd-products main`

### Apps sharing resources:

- [x] epicai-pro (epicdev-ai)
- [ ] epic-web-builder
- [ ] epic-react-builder

After all apps migrated:

```bash
pscale password list kcd-products main
pscale password delete kcd-products main OLD_PASSWORD_ID
```
