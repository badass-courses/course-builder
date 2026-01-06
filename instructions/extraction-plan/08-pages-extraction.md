# Pages & API Routes Extraction Plan

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Summary Statistics

| Category | 100% Identical | 4/5 Identical | Multiple Variants |
|----------|----------------|---------------|-------------------|
| API Routes | 15 | 2 | 3 |
| Admin Pages | 4 | 5 | 2 |
| Commerce Pages | 0 | 3 | 2 |
| User Pages | 1 | 1 | 3 |
| Root Files | 1 | 0 | 4 |
| **TOTAL** | **21** | **11** | **14** |

---

## TIER 1: API Routes - 100% Identical (15 routes)

Extract directly to `@coursebuilder/next/api`:

| Route | MD5 Hash |
|-------|----------|
| `api/auth/[...nextauth]/route.ts` | 326e22bee4eec8236b3c992d51de1540 |
| `api/trpc/[trpc]/route.ts` | fa3064c97af5ecb418f2fd05d246c636 |
| `api/inngest/route.ts` | 6f80ce0bfdd5970a5f21eb9c15027925 |
| `api/uploadthing/route.ts` | 69180b2ff1894efe76b231ffad26837e |
| `api/mux/route.ts` | f60dde8adaf79dbd8c6cb8960b44fdac |
| `api/mux/webhook/route.ts` | c8a78a7931442dc8ba6cdb3df5f8de05 |
| `api/postmark/webhook/route.ts` | 9644ab2a40675d49f0acc1c77405c48a |
| `api/thumbnails/route.ts` | 8f7700fc11acd74d19e61a0d4d1d7585 |
| `api/cron/route.ts` | 71da79b1bc0e4271fc34dc7cb510b76a |
| `api/ocr/webhook/route.ts` | b48f7c16d6999d7bad7f68e047a1fed9 |
| `api/coursebuilder/[...nextCourseBuilder]/route.ts` | 3913b4c23a981921bafd584d32e11484 |
| `api/videos/[videoResourceId]/route.ts` | c609d381f520ed2699b0cf3dac2ff01d |
| `api/uploads/new/route.ts` | bfef1d51cec97e6974e39959b8b1963f |
| `api/uploads/signed-url/route.ts` | e1396523ffaf3c40bd7399421fc4b0cc |
| `api/posts/route.ts` | 04deb94197c5898cbe756c232dc85c02 |

**Note**: ai-hero uses route groups `api/(content)/...` for some routes, but content is 100% identical.

### 4/5 Identical API Routes (2 routes)

| Route | Outlier | Recommendation |
|-------|---------|----------------|
| `api/lessons/route.ts` | epicdev-ai | Use 4-app version |
| `api/lessons/[lessonId]/solution/route.ts` | epicdev-ai | Use 4-app version |

### 4/4 Identical (epicdev-ai missing)

| Route | MD5 Hash |
|-------|----------|
| `api/chat/route.ts` | c8e5a2c83ea7d97d4e8e613296aba7d5 |

---

## TIER 2: Feature Gap API Routes

**Goal**: Feature parity across all apps. Add to all apps.

### From ai-hero
- `api/shortlinks/route.ts` - Short URL generation

### From epicdev-ai (live events)
- `api/progress/route.ts` - Progress tracking
- `api/workshops/[slug]/route.ts` - Workshop data
- `api/workshops/[slug]/access/route.ts` - Workshop access checks

---

## TIER 3: Admin Pages

### 100% Identical (4 pages) - Extract to `@coursebuilder/next/admin`

| Page | MD5 Hash |
|------|----------|
| `admin/tags/page.tsx` | 3eb276d0e7bf99554cfc835357dc4ac7 |
| `admin/coupons/page.tsx` | 608ac8e02f617bbe0fe9e655bfa9ccac |
| `admin/emails/new/page.tsx` | dfbc56b036d4d8f1bd60819de47f79b1 |
| `admin/flags/[key]/page.tsx` | (verify) |

### 4/5 Identical (epicdev-ai differs)

| Page | 4-app MD5 | epicdev-ai MD5 |
|------|-----------|----------------|
| `admin/flags/page.tsx` | 4cb18bc1eb95658faa13f6830aec3aa1 | c8bf6381101d0097757f3be5502c9d74 |
| `admin/emails/page.tsx` | efdeca34eda63d2fc0dda95e3170b56c | 5baa9f60e79958fcf35cb12125e64c8a |
| `admin/emails/[slug]/edit/page.tsx` | (verify) | differs |

### 3/4 Identical (ai-hero differs, epicdev-ai missing)

| Page | 3-app MD5 | ai-hero MD5 |
|------|-----------|-------------|
| `admin/dashboard/page.tsx` | 0b675dbb7ac1c45f1326c40df79a6c18 | fa48d93d3c5652bb5056f09d9692b5fb |

### Feature Gap Admin Pages

**From ai-hero**:
- `admin/surveys/page.tsx` - Survey management
- `admin/surveys/[slug]/page.tsx` - Survey edit

**From dev-build cluster**:
- `admin/pages/page.tsx` - Static pages management
- `admin/pages/new/page.tsx` - Create static pages

---

## TIER 4: Commerce Pages - (commerce) route group

### 4/5 Identical (epicdev-ai differs)

| Page | 4-app MD5 | epicdev-ai MD5 |
|------|-----------|----------------|
| `(commerce)/invoices/page.tsx` | 1d4738f69b3940724623e5d38ac229d0 | 076c764263b0784abde11dd90fe4da04 |
| `(commerce)/products/page.tsx` | 807c58eac17a13e7897647dd666f6b97 | 16945f06caf6114eadedca8715018793 |

### 3/5 Identical (dev-build cluster)

| Page | Cluster MD5 |
|------|-------------|
| `(commerce)/thanks/purchase/page.tsx` | 300c70548778a3a9497b0409dd405716 |
| `(commerce)/welcome/page.tsx` | 143349d1ddd64dd11981850e6565ed63 |

**Pattern**: dev-build = just-react = code-with-antonio; ai-hero and epicdev-ai differ.

---

## TIER 5: User Pages - (user) route group

### 4/5 Identical (epicdev-ai differs)

| Page | 4-app MD5 | epicdev-ai MD5 |
|------|-----------|----------------|
| `(user)/profile/page.tsx` | fac4bd624137617ef2645a3373099323 | 4ddc22af97906e85583d3db0c3a0d131 |

### 2/5 Identical (dev-build = just-react)

| Page | 2-app MD5 |
|------|-----------|
| `(user)/login/page.tsx` | c1083ca24377929dbdc41e7a3b1fa2d1 |

**Login page has 4 different versions - likely app-specific branding.**

---

## TIER 6: Root Files

### 100% Identical (1 file)

| File | MD5 Hash |
|------|----------|
| `global-error.tsx` | cf824b339e9f36f978283e1308676587 |

### All Different (intentionally app-specific)

| File | Reason |
|------|--------|
| `page.tsx` | Landing page - app-specific content |
| `layout.tsx` | Root layout - app-specific branding |

---

## Route Group Structure

All apps share the same route groups (except epicdev-ai missing `(organization)`):

```
app/
├── (commerce)/     # Commerce routes (invoices, products, thanks, welcome)
├── (content)/      # Content routes (posts, workshops, lessons)
├── (email-list)/   # Email subscription routes
├── (organization)/ # Org management (missing in epicdev-ai)
├── (search)/       # Search routes
├── (user)/         # User routes (login, profile)
├── admin/          # Admin dashboard
└── api/            # API routes
```

**Action**: Add `(organization)` route group to epicdev-ai.

---

## Key Findings: Path Structure Differences

### ai-hero uses route groups for API
ai-hero organizes content APIs differently:
```
ai-hero:     api/(content)/posts/route.ts
others:      api/posts/route.ts
```

**Content is 100% identical** despite different paths. Consider standardizing to the simpler path.

---

## Implementation Strategy

### For 100% Identical API Routes

```typescript
// apps/ai-hero/src/app/api/inngest/route.ts
export { handler as GET, handler as POST } from '@coursebuilder/next/api/inngest'
```

### For 100% Identical Pages

```typescript
// apps/ai-hero/src/app/admin/tags/page.tsx
export { default } from '@coursebuilder/next/admin/tags-page'
```

### For Pages with App-Specific Imports

Many pages import from local `@/lib/*` paths. Strategy:
1. Extract page logic to shared package
2. Use dependency injection pattern for app-specific data
3. Or keep as wrappers that provide local dependencies

---

## Implementation Priority

### Phase 1: API Routes (HIGH VALUE)
1. [ ] Extract 15 identical API routes
2. [ ] Handle route group differences (ai-hero's `(content)/` group)
3. [ ] Add feature gap routes to all apps

### Phase 2: Admin Pages (HIGH VALUE)
1. [ ] Extract 4 identical admin pages
2. [ ] Review epicdev-ai differences for 4/5 identical pages
3. [ ] Add survey pages to all apps (from ai-hero)
4. [ ] Add static pages management to all apps (from dev-build)

### Phase 3: Commerce/User Pages (MEDIUM VALUE)
1. [ ] Extract profile page (4/5 identical)
2. [ ] Review commerce page differences
3. [ ] Standardize login page pattern

### Phase 4: Root Files (LOW PRIORITY)
1. [ ] Extract global-error.tsx
2. [ ] Keep layout.tsx and page.tsx app-specific

---

## Package Structure

```
packages/next/src/
├── api/
│   ├── auth.ts           # [...nextauth] route handler
│   ├── trpc.ts           # [trpc] route handler
│   ├── inngest.ts        # inngest route handler
│   ├── uploadthing.ts    # uploadthing route handler
│   ├── mux.ts            # mux route handler
│   ├── mux-webhook.ts    # mux webhook handler
│   ├── postmark-webhook.ts
│   ├── thumbnails.ts
│   ├── cron.ts
│   ├── ocr-webhook.ts
│   ├── coursebuilder.ts  # [...nextCourseBuilder]
│   ├── videos.ts         # [videoResourceId]
│   ├── uploads-new.ts
│   ├── uploads-signed-url.ts
│   ├── posts.ts
│   ├── lessons.ts
│   ├── lessons-solution.ts
│   └── chat.ts
├── admin/
│   ├── tags-page.tsx
│   ├── coupons-page.tsx
│   ├── emails-new-page.tsx
│   ├── emails-page.tsx
│   ├── flags-page.tsx
│   └── dashboard-page.tsx
└── pages/
    ├── global-error.tsx
    ├── profile-page.tsx
    └── invoices-page.tsx
```

---

## Verification

```bash
# Compare API routes
md5 apps/*/src/app/api/inngest/route.ts

# Compare admin pages
md5 apps/*/src/app/admin/tags/page.tsx

# Build after changes
pnpm build:all
```
