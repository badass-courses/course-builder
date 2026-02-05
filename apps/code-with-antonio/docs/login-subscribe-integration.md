# Login + Newsletter Subscription Integration

## TL;DR

**This is already implemented!** OAuth login via GitHub/Discord automatically creates a newsletter subscription (CommunicationPreference) through the existing Inngest `userCreated` workflow.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    OAuth Login Flow                             │
└─────────────────────────────────────────────────────────────────┘

  User clicks "Login with GitHub/Discord"
                    │
                    ▼
  ┌─────────────────────────────────┐
  │   NextAuth OAuth Provider       │
  │   (GitHub / Discord)            │
  └─────────────────────────────────┘
                    │
                    ▼
  ┌─────────────────────────────────┐
  │   Drizzle Adapter               │
  │   Creates user in DB            │
  └─────────────────────────────────┘
                    │
                    ▼
  ┌─────────────────────────────────┐
  │   NextAuth createUser event     │  ◀── auth.ts:134-145
  │   (events callback)             │
  └─────────────────────────────────┘
                    │
                    ▼
  ┌─────────────────────────────────┐
  │   Inngest USER_CREATED_EVENT    │
  │   Dispatched async              │
  └─────────────────────────────────┘
                    │
                    ▼
  ┌─────────────────────────────────┐
  │   userCreated function          │  ◀── inngest/functions/user-created.ts
  │   • Creates user role           │
  │   • Creates Newsletter pref     │  ◀── CommunicationPreference record
  │   • Sends notification          │
  └─────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/server/auth.ts` | NextAuth config with `createUser` event callback |
| `src/inngest/functions/user-created.ts` | Inngest handler that creates newsletter preference |
| `src/lib/subscribe-actions.ts` | Manual subscribe form (same outcome) |

## Database Records Created

When a user signs up via OAuth, the `userCreated` Inngest function creates:

```sql
-- CommunicationPreference record
INSERT INTO CommunicationPreference (
  id,
  userId,          -- new user's ID
  channelId,       -- Email channel
  preferenceTypeId,-- Newsletter type
  active,          -- true
  preferenceLevel, -- 'medium'
  optInAt,         -- NOW()
  createdAt,
  updatedAt
)
```

## Comparison: Subscribe Form vs OAuth Login

| Aspect | Subscribe Form | OAuth Login |
|--------|---------------|-------------|
| Entry point | Email input form | GitHub/Discord button |
| User creation | `findOrCreateUser(email)` | NextAuth adapter |
| Newsletter pref | `subscribeToNewsletter` action | `userCreated` Inngest function |
| Cookie set | `cb_subscriber` cookie | No cookie (session-based) |
| Confirmation | Redirect to `/confirmed` | Direct to app |

**Both paths result in the same CommunicationPreference record.**

## If You Need Explicit Consent

If legal/UX requirements demand explicit opt-in (not auto-subscribe):

### Option 1: Post-login redirect
```typescript
// In auth.ts callbacks.signIn or middleware
if (isNewUser) {
  return '/subscribe?email=' + encodeURIComponent(user.email)
}
```

### Option 2: Modify userCreated function
```typescript
// In user-created.ts - set active=false by default
await db.insert(communicationPreferences).values({
  ...
  active: false,  // Require explicit opt-in
  ...
})
```

### Option 3: Add consent checkbox to login UI
Show a "Subscribe to newsletter" checkbox on the login/signup page and pass the preference through OAuth state.

## Verification

To verify OAuth signup creates newsletter subscriptions:

```sql
-- Check if OAuth users have newsletter preferences
SELECT u.email, cp.active, cp.optInAt
FROM User u
JOIN CommunicationPreference cp ON u.id = cp.userId
JOIN CommunicationPreferenceType cpt ON cp.preferenceTypeId = cpt.id
WHERE cpt.name = 'Newsletter'
ORDER BY cp.createdAt DESC
LIMIT 10;
```

## Troubleshooting

**Newsletter pref not created after OAuth login?**

1. Check Inngest dashboard for `USER_CREATED_EVENT` execution
2. Verify seeded data exists: `CommunicationPreferenceType` (Newsletter) and `CommunicationChannel` (Email)
3. Check `userCreated` function logs for errors
4. Ensure Inngest is running and connected

**Users not showing as subscribed in UI?**

The subscribe form uses `cb_subscriber` cookie for detection. OAuth users won't have this cookie. Use the `getCurrentSubscriberFromCookie` tRPC query which checks both cookie and database.

## Architecture Decision

The current implementation auto-subscribes OAuth users to the newsletter. This is intentional because:

1. **Consistency**: All users get the same onboarding experience
2. **Simplicity**: One flow handles both OAuth and email signup
3. **Reversibility**: Users can unsubscribe anytime via preference settings

If this changes, update the `userCreated` Inngest function to either skip preference creation or set `active: false`.
