# Inngest Functions Extraction Plan

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Key Principle: Non-Identical = Accidental Drift

When functions are ~80-95% identical, the variations are **accidental drift** from incomplete updates or new apps being created by copying older apps.

**Strategy to pick the canonical version:**
1. **Primary**: Pick the **largest file** (most complete implementation)
2. **Secondary**: Review diff to confirm larger = more features (not just whitespace)
3. **Ignore timestamps**: New apps might be copied from older apps, so "newest" isn't reliable

---

## Priority 1: 100% Identical Functions (HIGH VALUE - 7 functions)

These are 100% identical across all 5 active apps and can be extracted immediately.

### video-resource-attached.ts
**Status**: 100% identical (verified via md5)

```bash
MD5 (apps/ai-hero/src/inngest/functions/video-resource-attached.ts) = 3f2f2f8f1f8b37271a26ed4574cb1625
MD5 (apps/dev-build/src/inngest/functions/video-resource-attached.ts) = 3f2f2f8f1f8b37271a26ed4574cb1625
MD5 (apps/epicdev-ai/src/inngest/functions/video-resource-attached.ts) = 3f2f2f8f1f8b37271a26ed4574cb1625
MD5 (apps/just-react/src/inngest/functions/video-resource-attached.ts) = 3f2f2f8f1f8b37271a26ed4574cb1625
MD5 (apps/code-with-antonio/src/inngest/functions/video-resource-attached.ts) = 3f2f2f8f1f8b37271a26ed4574cb1625
```

### split_video.ts
**Status**: 100% identical (verified via md5)

```bash
MD5 (apps/ai-hero/src/inngest/functions/split_video.ts) = e51ff289e7cc1e4639658b3d2c9b9159
MD5 (apps/dev-build/src/inngest/functions/split_video.ts) = e51ff289e7cc1e4639658b3d2c9b9159
MD5 (apps/epicdev-ai/src/inngest/functions/split_video.ts) = e51ff289e7cc1e4639658b3d2c9b9159
MD5 (apps/just-react/src/inngest/functions/split_video.ts) = e51ff289e7cc1e4639658b3d2c9b9159
MD5 (apps/code-with-antonio/src/inngest/functions/split_video.ts) = e51ff289e7cc1e4639658b3d2c9b9159
```

### email-send-broadcast.ts
**Status**: 100% identical (verified via md5)

```bash
MD5 (apps/ai-hero/src/inngest/functions/email-send-broadcast.ts) = 28bc363e176c44285609f1e876d16b7a
MD5 (apps/dev-build/src/inngest/functions/email-send-broadcast.ts) = 28bc363e176c44285609f1e876d16b7a
MD5 (apps/epicdev-ai/src/inngest/functions/email-send-broadcast.ts) = 28bc363e176c44285609f1e876d16b7a
MD5 (apps/just-react/src/inngest/functions/email-send-broadcast.ts) = 28bc363e176c44285609f1e876d16b7a
MD5 (apps/code-with-antonio/src/inngest/functions/email-send-broadcast.ts) = 28bc363e176c44285609f1e876d16b7a
```

### ensure-personal-organization.ts
**Status**: 100% identical (verified via md5)

```bash
MD5 (apps/ai-hero/src/inngest/functions/ensure-personal-organization.ts) = aef8b7f7c3f819835ac00af9ae7ff380
MD5 (apps/dev-build/src/inngest/functions/ensure-personal-organization.ts) = aef8b7f7c3f819835ac00af9ae7ff380
MD5 (apps/epicdev-ai/src/inngest/functions/ensure-personal-organization.ts) = aef8b7f7c3f819835ac00af9ae7ff380
MD5 (apps/just-react/src/inngest/functions/ensure-personal-organization.ts) = aef8b7f7c3f819835ac00af9ae7ff380
MD5 (apps/code-with-antonio/src/inngest/functions/ensure-personal-organization.ts) = aef8b7f7c3f819835ac00af9ae7ff380
```

### sync-purchase-tags.ts
**Status**: 100% identical (verified via md5)

```bash
MD5 (apps/ai-hero/src/inngest/functions/sync-purchase-tags.ts) = 8c0d7b6613c685d891d5799324120f17
MD5 (apps/dev-build/src/inngest/functions/sync-purchase-tags.ts) = 8c0d7b6613c685d891d5799324120f17
MD5 (apps/epicdev-ai/src/inngest/functions/sync-purchase-tags.ts) = 8c0d7b6613c685d891d5799324120f17
MD5 (apps/just-react/src/inngest/functions/sync-purchase-tags.ts) = 8c0d7b6613c685d891d5799324120f17
MD5 (apps/code-with-antonio/src/inngest/functions/sync-purchase-tags.ts) = 8c0d7b6613c685d891d5799324120f17
```

### user-created.ts
**Status**: 100% identical (verified via md5)

```bash
MD5 (apps/ai-hero/src/inngest/functions/user-created.ts) = c48bd213d3707f429ba8255335a153a6
MD5 (apps/dev-build/src/inngest/functions/user-created.ts) = c48bd213d3707f429ba8255335a153a6
MD5 (apps/epicdev-ai/src/inngest/functions/user-created.ts) = c48bd213d3707f429ba8255335a153a6
MD5 (apps/just-react/src/inngest/functions/user-created.ts) = c48bd213d3707f429ba8255335a153a6
MD5 (apps/code-with-antonio/src/inngest/functions/user-created.ts) = c48bd213d3707f429ba8255335a153a6
```

### cloudinary/image-resource-created.ts
**Status**: 100% identical (verified via md5)

```bash
MD5 (apps/ai-hero/src/inngest/functions/cloudinary/image-resource-created.ts) = 5dbde432ab5216c67c683d9e4920d2b5
MD5 (apps/dev-build/src/inngest/functions/cloudinary/image-resource-created.ts) = 5dbde432ab5216c67c683d9e4920d2b5
MD5 (apps/epicdev-ai/src/inngest/functions/cloudinary/image-resource-created.ts) = 5dbde432ab5216c67c683d9e4920d2b5
MD5 (apps/just-react/src/inngest/functions/cloudinary/image-resource-created.ts) = 5dbde432ab5216c67c683d9e4920d2b5
MD5 (apps/code-with-antonio/src/inngest/functions/cloudinary/image-resource-created.ts) = 5dbde432ab5216c67c683d9e4920d2b5
```

---

## Priority 2: 4/5 Apps Identical (Pick Most Complete Version)

### create-user-organization.ts
**Status**: 4/5 identical - epicdev-ai differs
**Recommendation**: Use 4-app version (dev-build, just-react, code-with-antonio, ai-hero)

```bash
MD5 (apps/ai-hero/src/inngest/functions/create-user-organization.ts) = 58d86cededc2835329f9f0276a1c4c42
MD5 (apps/dev-build/src/inngest/functions/create-user-organization.ts) = 58d86cededc2835329f9f0276a1c4c42
MD5 (apps/epicdev-ai/src/inngest/functions/create-user-organization.ts) = f88dec39dfabe197e86ab6a875d9d588  # differs
MD5 (apps/just-react/src/inngest/functions/create-user-organization.ts) = 58d86cededc2835329f9f0276a1c4c42
MD5 (apps/code-with-antonio/src/inngest/functions/create-user-organization.ts) = 58d86cededc2835329f9f0276a1c4c42
```

### cohort-entitlement-sync-workflow.ts
**Status**: 4/5 identical - ai-hero differs (smaller file, likely older version)
**Recommendation**: Use 4-app version (dev-build, epicdev-ai, just-react, code-with-antonio)

```bash
MD5 (apps/ai-hero/src/inngest/functions/cohort-entitlement-sync-workflow.ts) = f3dc04ad8b0c2c19a2599bfa75a389c4  # differs (3764 bytes)
MD5 (apps/dev-build/src/inngest/functions/cohort-entitlement-sync-workflow.ts) = bcb6b8e7fd0ae2300a406341b0063243  (3944 bytes)
MD5 (apps/epicdev-ai/src/inngest/functions/cohort-entitlement-sync-workflow.ts) = bcb6b8e7fd0ae2300a406341b0063243
MD5 (apps/just-react/src/inngest/functions/cohort-entitlement-sync-workflow.ts) = bcb6b8e7fd0ae2300a406341b0063243
MD5 (apps/code-with-antonio/src/inngest/functions/cohort-entitlement-sync-workflow.ts) = bcb6b8e7fd0ae2300a406341b0063243
```

### send-workshop-access-emails.ts
**Status**: 4/5 identical - ai-hero differs (larger file, likely newer with more features)
**Recommendation**: Review ai-hero version (11318 bytes vs 11321 bytes in others) - extract the more complete version

```bash
MD5 (apps/ai-hero/src/inngest/functions/send-workshop-access-emails.ts) = 155f55fede5bdf3a55e8c0bd2fdf937a  # differs (11318 bytes, Dec 4)
MD5 (apps/dev-build/src/inngest/functions/send-workshop-access-emails.ts) = 56ac889086a5468247d8a01e72417879  (11321 bytes)
MD5 (apps/epicdev-ai/src/inngest/functions/send-workshop-access-emails.ts) = 56ac889086a5468247d8a01e72417879
MD5 (apps/just-react/src/inngest/functions/send-workshop-access-emails.ts) = 56ac889086a5468247d8a01e72417879
MD5 (apps/code-with-antonio/src/inngest/functions/send-workshop-access-emails.ts) = 56ac889086a5468247d8a01e72417879
```

---

## Priority 3: Multiple Variants (Pick Largest/Most Complete)

### post-purchase-workflow.ts
**Status**: 3 different versions
**Recommendation**: Use ai-hero version (20078 bytes) - largest and most complete

| App | Size | Timestamp | MD5 |
|-----|------|-----------|-----|
| ai-hero | 20078 | Nov 19 | c54f2c4a8e3e8274ceb779f290e96ed7 |
| epicdev-ai | 19799 | Dec 16 | 22d9916ff115d3a079cc8d5d4de1dd8f |
| dev-build | 15935 | Nov 14 | 4ef1271053b29430fbf4ebcb64c87d21 |
| just-react | 15935 | Jan 5 | 4ef1271053b29430fbf4ebcb64c87d21 |
| code-with-antonio | 15935 | Oct 22 | 4ef1271053b29430fbf4ebcb64c87d21 |

### product-transfer-workflow.ts
**Status**: 3 different versions
**Recommendation**: Use ai-hero version (21076 bytes) - largest and most complete

| App | Size | Timestamp | MD5 |
|-----|------|-----------|-----|
| ai-hero | 21076 | Dec 11 | 9c58942b96304a6bc32d105bbf280133 |
| epicdev-ai | 13994 | Dec 8 | 76878b044a3e5d51e75a17098b67015e |
| dev-build | 13981 | Nov 14 | 0766301d9c7bd3272fbef12db8cd257c |
| just-react | 13981 | Jan 5 | 0766301d9c7bd3272fbef12db8cd257c |
| code-with-antonio | 13981 | Oct 13 | 0766301d9c7bd3272fbef12db8cd257c |

---

## Feature Gap Functions (EXTRACT & ADD TO ALL APPS)

**Goal**: Feature parity across all apps. These functions exist in some apps but should be available to all.

### From epicdev-ai (live events/calendar)
Extract and add to other apps:
- bulk-calendar-invites.ts
- calendar-sync.ts
- event-reminder-broadcast.ts
- post-event-purchase.ts
- unlist-past-events.ts

### From ai-hero
Extract and add to other apps:
- cohort-entitlement-sync-user.ts

**Strategy**: Extract to `@coursebuilder/next/inngest/functions/`, then import into all apps that need the functionality.

---

## Extraction Strategy

### Simple Re-export Pattern (for 100% identical)

```typescript
// apps/ai-hero/src/inngest/functions/video-resource-attached.ts
export { videoResourceAttached } from '@coursebuilder/next/inngest/functions/video-resource-attached'
```

### Factory Pattern (for functions needing app config)

```typescript
// packages/next/src/inngest/functions/post-purchase-workflow.ts
export function createPostPurchaseWorkflow(config: {
  inngest: Inngest
  db: Database
  appName: string
}) {
  return config.inngest.createFunction(
    { id: `${config.appName}-post-purchase`, name: 'Post Purchase Workflow' },
    { event: 'commerce/purchase.completed' },
    async ({ event, step }) => {
      // shared implementation
    }
  )
}
```

---

## Package Structure

```
packages/next/src/inngest/
├── index.ts
├── functions/
│   ├── video-resource-attached.ts    # 100% identical
│   ├── split-video.ts                # 100% identical
│   ├── user-created.ts               # 100% identical
│   ├── email-send-broadcast.ts       # 100% identical
│   ├── ensure-personal-organization.ts # 100% identical
│   ├── sync-purchase-tags.ts         # 100% identical
│   ├── create-user-organization.ts   # 4/5 identical
│   ├── cohort-entitlement-sync-workflow.ts  # 4/5 identical
│   ├── send-workshop-access-emails.ts  # 4/5 identical
│   ├── post-purchase-workflow.ts     # factory pattern
│   ├── product-transfer-workflow.ts  # factory pattern
│   └── cloudinary/
│       └── image-resource-created.ts # 100% identical
└── utils/
    ├── index.ts
    └── email-variants.ts
```

---

## Implementation Order

### Phase 1: 100% Identical Functions
1. [ ] Extract video-resource-attached.ts
2. [ ] Extract split_video.ts
3. [ ] Extract email-send-broadcast.ts
4. [ ] Extract ensure-personal-organization.ts
5. [ ] Extract sync-purchase-tags.ts
6. [ ] Extract user-created.ts
7. [ ] Extract cloudinary/image-resource-created.ts

### Phase 2: 4/5 Identical Functions
1. [ ] Extract create-user-organization.ts (use 4-app version)
2. [ ] Extract cohort-entitlement-sync-workflow.ts (use 4-app version)
3. [ ] Extract send-workshop-access-emails.ts (review both versions)

### Phase 3: Factory Pattern Functions
1. [ ] Extract post-purchase-workflow.ts (use ai-hero as base)
2. [ ] Extract product-transfer-workflow.ts (use ai-hero as base)

---

## Risk Assessment

| Component | Risk | Mitigation |
|-----------|------|------------|
| 100% identical functions | LOW | Direct extraction, re-export pattern |
| 4/5 identical functions | LOW | Pick majority version, test |
| Multiple variant functions | MEDIUM | Use newest/largest as base, test thoroughly |
| Event names | LOW | Keep event names unchanged |

---

## Verification

```bash
# Compare hashes to verify identity
md5 apps/*/src/inngest/functions/video-resource-attached.ts

# Test inngest functions locally
pnpm --filter="ai-hero" inngest:dev

# Build all apps
pnpm build:all
```
