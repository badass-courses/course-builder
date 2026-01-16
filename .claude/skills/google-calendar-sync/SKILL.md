---
name: google-calendar-sync
description: Wizard to set up Google Calendar API integration with service account authentication. Use when setting up calendar sync, Google Calendar API, service accounts, or domain-wide delegation.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# Google Calendar Sync Setup Wizard

This skill guides you through configuring a Google Cloud service account to sync events with Google Calendar. It uses `gcloud` CLI to automate most Google Cloud steps.

## How This Works

This is a **guided wizard** with two types of steps:

- **AGENT ACTION** - Steps you perform automatically via `gcloud` CLI or code
- **HUMAN ACTION REQUIRED** - Steps requiring manual intervention (browser auth, Admin Console)

When you hit a HUMAN ACTION REQUIRED step, use the AskUserQuestion tool to pause and wait for confirmation before continuing.

## State Detection

**Run this first** to determine current progress:

```bash
echo "=== GOOGLE CALENDAR SYNC STATE CHECK ==="

# Check 1: gcloud installed?
if command -v gcloud &> /dev/null; then
  echo "gcloud: INSTALLED"
else
  echo "gcloud: MISSING -> Start at Step 0.1"
fi

# Check 2: gcloud authenticated?
if gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>/dev/null | grep -q "@"; then
  echo "gcloud_auth: AUTHENTICATED as $(gcloud auth list --filter='status:ACTIVE' --format='value(account)' | head -1)"
else
  echo "gcloud_auth: NOT_AUTHENTICATED -> Complete Step 0.2"
fi

# Check 3: Project configured?
PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -n "$PROJECT" ] && [ "$PROJECT" != "(unset)" ]; then
  echo "project: CONFIGURED as $PROJECT"
else
  echo "project: NOT_SET -> Start at Phase 2"
fi

# Check 4: Calendar API enabled?
if [ -n "$PROJECT" ] && [ "$PROJECT" != "(unset)" ]; then
  if gcloud services list --enabled --filter="name:calendar" --format="value(name)" 2>/dev/null | grep -q "calendar"; then
    echo "calendar_api: ENABLED"
  else
    echo "calendar_api: NOT_ENABLED -> Complete Step 2.2"
  fi
fi

# Check 5: Service account exists?
if [ -n "$PROJECT" ] && [ "$PROJECT" != "(unset)" ]; then
  SA_EMAIL="calendar-sync@${PROJECT}.iam.gserviceaccount.com"
  if gcloud iam service-accounts describe "$SA_EMAIL" &>/dev/null; then
    echo "service_account: EXISTS ($SA_EMAIL)"
  else
    echo "service_account: NOT_FOUND -> Complete Step 2.3"
  fi
fi

# Check 6: Credentials file exists?
if [ -f "google-credentials.json" ]; then
  echo "credentials_file: EXISTS (needs base64 encoding)"
elif [ -f "google-credentials.b64" ]; then
  echo "credentials_b64: EXISTS"
else
  echo "credentials: NOT_FOUND -> Complete Step 2.5"
fi

# Check 7: Environment variables?
echo "=== ENV VAR CHECK ==="
if [ -f ".env.local" ]; then
  grep -q "GOOG_CREDENTIALS_JSON" .env.local 2>/dev/null && echo "GOOG_CREDENTIALS_JSON: SET in .env.local" || echo "GOOG_CREDENTIALS_JSON: MISSING"
  grep -q "GOOG_CALENDAR_IMPERSONATE_USER" .env.local 2>/dev/null && echo "GOOG_CALENDAR_IMPERSONATE_USER: SET in .env.local" || echo "GOOG_CALENDAR_IMPERSONATE_USER: MISSING"
  grep -q "GOOG_CALENDAR_ID" .env.local 2>/dev/null && echo "GOOG_CALENDAR_ID: SET in .env.local" || echo "GOOG_CALENDAR_ID: MISSING"
elif [ -f ".env" ]; then
  grep -q "GOOG_CREDENTIALS_JSON" .env 2>/dev/null && echo "GOOG_CREDENTIALS_JSON: SET in .env" || echo "GOOG_CREDENTIALS_JSON: MISSING"
  grep -q "GOOG_CALENDAR_IMPERSONATE_USER" .env 2>/dev/null && echo "GOOG_CALENDAR_IMPERSONATE_USER: SET in .env" || echo "GOOG_CALENDAR_IMPERSONATE_USER: MISSING"
  grep -q "GOOG_CALENDAR_ID" .env 2>/dev/null && echo "GOOG_CALENDAR_ID: SET in .env" || echo "GOOG_CALENDAR_ID: MISSING"
else
  echo "env_file: NOT_FOUND -> Complete Phase 5"
fi

# Check 8: googleapis package?
if [ -f "package.json" ]; then
  grep -q "googleapis" package.json && echo "googleapis: INSTALLED" || echo "googleapis: NOT_INSTALLED -> Complete Step 5.4"
fi

echo "=== END STATE CHECK ==="
```

Based on the state check output, skip to the appropriate phase.

---

## Prerequisites (Agent Checks + Human Installs)

Check for required tools and guide the user through installing anything missing.

### Step 0.1: Check for gcloud CLI

```bash
if command -v gcloud &> /dev/null; then
  echo "INSTALLED: gcloud $(gcloud --version 2>/dev/null | head -1)"
else
  echo "NOT_INSTALLED: gcloud"
fi
```

**If NOT_INSTALLED**, use AskUserQuestion to prompt installation:

> Install the Google Cloud CLI:
>
> **macOS (Homebrew):** `brew install google-cloud-sdk`
>
> **macOS (Manual):**
> ```bash
> curl https://sdk.cloud.google.com | bash
> exec -l $SHELL
> ```
>
> **Linux (Debian/Ubuntu):**
> ```bash
> sudo apt-get install apt-transport-https ca-certificates gnupg curl
> curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
> echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
> sudo apt-get update && sudo apt-get install google-cloud-cli
> ```
>
> **Linux (Other):**
> ```bash
> curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
> tar -xf google-cloud-cli-linux-x86_64.tar.gz
> ./google-cloud-sdk/install.sh
> ```
>
> **Windows:** Download from https://cloud.google.com/sdk/docs/install

### Step 0.2: Check gcloud authentication

```bash
if gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>/dev/null | head -1 | grep -q "@"; then
  echo "AUTHENTICATED: $(gcloud auth list --filter='status:ACTIVE' --format='value(account)' | head -1)"
else
  echo "NOT_AUTHENTICATED"
fi
```

**If NOT_AUTHENTICATED**, prompt the user to run:

```bash
gcloud auth login
```

This opens a browser for Google account authentication. Wait for confirmation.

### Step 0.3: Check for Node.js

```bash
if command -v node &> /dev/null; then
  echo "INSTALLED: node $(node --version)"
else
  echo "NOT_INSTALLED: node"
fi
```

**If NOT_INSTALLED**, prompt installation:
- **macOS:** `brew install node`
- **Linux:** `curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs`
- Or use nvm: https://github.com/nvm-sh/nvm

### Step 0.4: Check for package manager

```bash
if command -v pnpm &> /dev/null; then
  echo "INSTALLED: pnpm $(pnpm --version)"
elif command -v yarn &> /dev/null; then
  echo "INSTALLED: yarn $(yarn --version)"
elif command -v npm &> /dev/null; then
  echo "INSTALLED: npm $(npm --version)"
else
  echo "NOT_INSTALLED: package manager"
fi
```

---

## Phase 1: Project Discovery

### Step 1.1: Check existing Google credentials

```bash
grep -r "GOOG_" .env* 2>/dev/null || echo "No existing Google config found"
grep -r "GOOGLE_" .env* 2>/dev/null || echo "No existing Google config found"
```

### Step 1.2: List existing gcloud projects

```bash
gcloud projects list --format="table(projectId,name,createTime)"
```

Use AskUserQuestion: **Use an existing project or create a new one?**

---

## Phase 2: Google Cloud Setup (Mostly Automated)

### Step 2.1: Create or select project

**Create new project:**

```bash
PROJECT_ID="calendar-sync-$(date +%s | tail -c 7)"
PROJECT_NAME="Calendar Sync"

gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME"
gcloud config set project "$PROJECT_ID"
```

**Or select existing:**

```bash
gcloud config set project YOUR_PROJECT_ID
```

### Step 2.2: Enable Google Calendar API

```bash
gcloud services enable calendar-json.googleapis.com
```

Verify:

```bash
gcloud services list --enabled --filter="name:calendar"
```

### Step 2.3: Create service account

```bash
SERVICE_ACCOUNT_NAME="calendar-sync"
PROJECT_ID=$(gcloud config get-value project)

gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
  --display-name="Calendar Sync Service" \
  --description="Manages calendar events for the application"
```

### Step 2.4: Grant permissions

```bash
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT_EMAIL="calendar-sync@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/owner"
```

### Step 2.5: Create service account key

```bash
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT_EMAIL="calendar-sync@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts keys create ./google-credentials.json \
  --iam-account="$SERVICE_ACCOUNT_EMAIL"
```

**If this fails with "Key creation is not allowed"**, prompt user:

> Disable the org policy constraint. Run (requires org admin):
> ```bash
> gcloud org-policies reset iam.disableServiceAccountKeyCreation --project="$PROJECT_ID"
> ```
>
> Or via Console: [Organization Policies](https://console.cloud.google.com/iam-admin/orgpolicies) > search `iam.disableServiceAccountKeyCreation` > Override > Not enforced.

### Step 2.6: Base64 encode credentials

```bash
cat google-credentials.json | base64 -w 0 > google-credentials.b64
echo "Credentials encoded to google-credentials.b64"
cat google-credentials.b64
```

### Step 2.7: Get Client ID for domain-wide delegation

```bash
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT_EMAIL="calendar-sync@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" \
  --format="value(uniqueId)"
```

Save this Client ID for Phase 3.

---

## Phase 3: Domain-Wide Delegation (Human Action Required)

> **Note:** Only required for Google Workspace. Skip if using personal Gmail with calendar sharing.

### Step 3.1: Configure Domain-Wide Delegation

**HUMAN ACTION REQUIRED** - Use AskUserQuestion to guide:

1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to **Security > Access and data control > API controls**
3. Click **Manage Domain Wide Delegation**
4. Click **Add new**
5. Enter the **Client ID** from Step 2.7
6. Add OAuth scope: `https://www.googleapis.com/auth/calendar.events`
7. Click **Authorize**

Wait for "Delegation configured" confirmation.

### Step 3.2: Identify Impersonation User

**HUMAN ACTION REQUIRED**

Ask for the email of a Google Workspace user who has access to the target calendar. This becomes `GOOG_CALENDAR_IMPERSONATE_USER`.

---

## Phase 4: Get Calendar ID

### Step 4.1: Find the calendar ID

**Option A - Primary calendar:** The calendar ID is the user's email address.

**Option B - Shared/secondary calendar:**

**HUMAN ACTION REQUIRED** - Use AskUserQuestion:

1. Open [Google Calendar](https://calendar.google.com)
2. Find your calendar in the left sidebar
3. Click the three dots > **Settings and sharing**
4. Scroll to **Integrate calendar**
5. Copy the **Calendar ID** (looks like `abc123@group.calendar.google.com`)

---

## Phase 5: Environment Configuration

### Step 5.1: Add environment variables

After getting the base64 credentials, impersonation user, and calendar ID from the user:

```bash
CREDS_B64=$(cat google-credentials.b64)
IMPERSONATE_USER="user@yourdomain.com"  # Get from user
CALENDAR_ID="calendar-id@group.calendar.google.com"  # Get from user

cat >> .env.local << EOF

# Google Calendar Integration
GOOG_CREDENTIALS_JSON="$CREDS_B64"
GOOG_CALENDAR_IMPERSONATE_USER="$IMPERSONATE_USER"
GOOG_CALENDAR_ID="$CALENDAR_ID"
EOF
```

### Step 5.2: Add to .env.example

```bash
cat >> .env.example << 'EOF'

# Google Calendar Integration
# See: .claude/skills/google-calendar-sync/SKILL.md
GOOG_CREDENTIALS_JSON=
GOOG_CALENDAR_IMPERSONATE_USER=
GOOG_CALENDAR_ID=
EOF
```

### Step 5.3: Update .gitignore

```bash
echo "google-credentials.json" >> .gitignore
echo "google-credentials.b64" >> .gitignore
```

### Step 5.4: Install googleapis package

```bash
if command -v pnpm &> /dev/null; then
  pnpm add googleapis
elif command -v yarn &> /dev/null; then
  yarn add googleapis
else
  npm install googleapis
fi
```

### Step 5.5: Create calendar utility module

Create `lib/google-calendar.ts` with the following content:

```typescript
import { google } from 'googleapis'

function getCalendarClient() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOG_CREDENTIALS_JSON!, 'base64').toString()
  )

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    clientOptions: {
      subject: process.env.GOOG_CALENDAR_IMPERSONATE_USER,
    },
  })

  return google.calendar({ version: 'v3', auth })
}

export async function createCalendarEvent(event: {
  summary: string
  description?: string
  start: Date
  end: Date
  location?: string
}) {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOG_CALENDAR_ID!

  return calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'UTC',
      },
    },
  })
}

export async function updateCalendarEvent(
  eventId: string,
  event: {
    summary?: string
    description?: string
    start?: Date
    end?: Date
    location?: string
  }
) {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOG_CALENDAR_ID!

  return calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      ...(event.summary && { summary: event.summary }),
      ...(event.description && { description: event.description }),
      ...(event.location && { location: event.location }),
      ...(event.start && {
        start: { dateTime: event.start.toISOString(), timeZone: 'UTC' },
      }),
      ...(event.end && {
        end: { dateTime: event.end.toISOString(), timeZone: 'UTC' },
      }),
    },
  })
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOG_CALENDAR_ID!

  return calendar.events.delete({
    calendarId,
    eventId,
  })
}

export async function listCalendarEvents(options?: {
  timeMin?: Date
  timeMax?: Date
  maxResults?: number
}) {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOG_CALENDAR_ID!

  return calendar.events.list({
    calendarId,
    timeMin: options?.timeMin?.toISOString(),
    timeMax: options?.timeMax?.toISOString(),
    maxResults: options?.maxResults ?? 10,
    singleEvents: true,
    orderBy: 'startTime',
  })
}
```

---

## Phase 6: Verification

### Step 6.1: Verify environment variables

```bash
echo "=== VERIFYING ENV VARS ==="

if [ -f ".env.local" ]; then
  source .env.local 2>/dev/null
elif [ -f ".env" ]; then
  source .env 2>/dev/null
fi

MISSING=""
[ -z "$GOOG_CREDENTIALS_JSON" ] && MISSING="$MISSING GOOG_CREDENTIALS_JSON"
[ -z "$GOOG_CALENDAR_IMPERSONATE_USER" ] && MISSING="$MISSING GOOG_CALENDAR_IMPERSONATE_USER"
[ -z "$GOOG_CALENDAR_ID" ] && MISSING="$MISSING GOOG_CALENDAR_ID"

if [ -n "$MISSING" ]; then
  echo "MISSING ENV VARS:$MISSING"
  echo "Please complete Phase 5 before testing."
  exit 1
else
  echo "All required env vars are set!"
fi
```

### Step 6.2: Test connection

```bash
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
elif [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

node -e "
const { google } = require('googleapis');

if (!process.env.GOOG_CREDENTIALS_JSON) {
  console.error('ERROR: GOOG_CREDENTIALS_JSON not set');
  process.exit(1);
}

const creds = JSON.parse(Buffer.from(process.env.GOOG_CREDENTIALS_JSON, 'base64').toString());
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/calendar.events'],
  clientOptions: { subject: process.env.GOOG_CALENDAR_IMPERSONATE_USER }
});
const calendar = google.calendar({ version: 'v3', auth });

console.log('Testing connection to calendar:', process.env.GOOG_CALENDAR_ID);
console.log('Impersonating user:', process.env.GOOG_CALENDAR_IMPERSONATE_USER);

calendar.events.list({
  calendarId: process.env.GOOG_CALENDAR_ID,
  maxResults: 5,
  timeMin: new Date().toISOString(),
  singleEvents: true,
  orderBy: 'startTime'
}).then(r => {
  console.log('SUCCESS! Connection working.');
  console.log('Found', r.data.items?.length || 0, 'upcoming events');
  if (r.data.items?.length > 0) {
    console.log('Next event:', r.data.items[0].summary);
  }
}).catch(e => {
  console.error('ERROR:', e.message);
  if (e.message.includes('insufficient')) {
    console.error('-> Check domain-wide delegation is configured correctly');
  }
  if (e.message.includes('not found')) {
    console.error('-> Check GOOG_CALENDAR_ID is correct');
  }
  process.exit(1);
});
"
```

### Step 6.3: Cleanup sensitive files

```bash
rm -f google-credentials.json google-credentials.b64
echo "Sensitive files cleaned up"
```

---

## Troubleshooting

### "Insufficient Permission" errors
- Verify domain-wide delegation uses correct Client ID
- Scope must match exactly: `https://www.googleapis.com/auth/calendar.events`
- Impersonation user must have calendar access

### "Key creation is not allowed"
```bash
gcloud org-policies reset iam.disableServiceAccountKeyCreation --project="$(gcloud config get-value project)"
```

### Find calendar ID via API
```bash
node -e "
const { google } = require('googleapis');
const creds = JSON.parse(Buffer.from(process.env.GOOG_CREDENTIALS_JSON, 'base64').toString());
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  clientOptions: { subject: process.env.GOOG_CALENDAR_IMPERSONATE_USER }
});
const calendar = google.calendar({ version: 'v3', auth });
calendar.calendarList.list().then(r => {
  r.data.items?.forEach(c => console.log(c.id, '-', c.summary));
}).catch(e => console.error('Error:', e.message));
"
```

---

## Checklist

- [ ] `gcloud` CLI installed and authenticated
- [ ] Google Cloud project created/selected
- [ ] Google Calendar API enabled
- [ ] Service account created
- [ ] Service account key generated and base64-encoded
- [ ] Domain-wide delegation configured (Workspace only)
- [ ] Environment variables added to `.env`
- [ ] `googleapis` package installed
- [ ] Calendar utility module created
- [ ] Connection tested
- [ ] Sensitive files cleaned up
