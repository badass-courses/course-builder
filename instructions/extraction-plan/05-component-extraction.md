# TSX Component Extraction Plan

## STATUS: DEFERRED

> **Decision**: Component extraction is deferred until higher-priority items are complete. Components have more complex dependencies and require careful consideration of branding/UI variations.

---

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Summary Statistics

| Category | 100% Identical | 4/5 Identical | Multiple Variants |
|----------|----------------|---------------|-------------------|
| Single Files | 7 | 1 | 6+ (app-specific) |
| CodeHike | 10 | 2 | 1 |
| Certificates | 2 | 3 (branding) | - |
| List-editor | 4 | 2 | 3 |
| Resources-crud | 4 | 1 | 1 |
| Feedback-widget | 3 | - | - |
| Team-inquiry | 3 | - | - |
| Hooks | 5 | 3 | 1 |
| **TOTAL** | **38** | **12** | **12+** |

---

## TIER 1: 100% Identical Single Files (7 files)

Extract directly to `@coursebuilder/ui` or `@coursebuilder/next`:

| File | MD5 Hash | Target Package |
|------|----------|----------------|
| `spinner.tsx` | 6bf0df7d5fcd5a99da1f74036419b2e7 | `@coursebuilder/ui` |
| `party.tsx` | 524774a64dd90f0cf1bcd41a39810f6b | `@coursebuilder/ui` |
| `player-skeleton.tsx` | 1e9b29b7995385643f0d526ed5b275b5 | `@coursebuilder/ui` |
| `providers.tsx` | 0a770e1983f2e3e184791fb58071c1ab | `@coursebuilder/next/providers` |
| `theme-provider.tsx` | fd461456d86914fc23038dca9dc7dd85 | `@coursebuilder/next/providers` |
| `video-block-newsletter-cta.tsx` | 0527348fa494087be9920bcacadec130 | `@coursebuilder/next/components` |
| `assistant-workflow-selector.tsx` | 66e4575eb45525222c15506579b296a7 | `@coursebuilder/next/components` |

### 4/5 Identical Single Files

| File | Outlier | Recommendation |
|------|---------|----------------|
| `amplitude-provider.tsx` | epicdev-ai differs | Use 4-app version, review epicdev-ai diff |

---

## TIER 2: CodeHike Components (13 files)

### 100% Identical (10 files) - Extract to `@coursebuilder/ui/codehike`

| File | MD5 Hash |
|------|----------|
| `callout.tsx` | f755d0de9be07a16300ae3c8c0d8b085 |
| `diff.tsx` | 35472acb7241faf7551e7ec31a743647 |
| `focus.client.tsx` | 43af0e82ea3b1bd9fca516aea08115db |
| `focus.tsx` | 973cb80d7d952af3de062cd7bebbb01b |
| `fold.tsx` | 56b457ac0c98ec1a79a87cb6443393af |
| `handlers.tsx` | eabddd7b3ed5c1b05ab3f0ed374e35dd |
| `link.tsx` | b6bbf81c293e65edc498af217f4339dd |
| `mark.tsx` | d4219a84f0795ad7fc01f632cd6acdcc |
| `smooth-pre.tsx` | 71b8394df08d4a634d78c61733b7cb06 |
| `token-transitions.tsx` | a1664818ad91993a525150fb02516815 |

### 4/5 Identical (2 files)

| File | Outlier | Recommendation |
|------|---------|----------------|
| `copy-button.tsx` | ai-hero differs | Use 4-app version |
| `scrollycoding.tsx` | epicdev-ai differs | Use 4-app version |

### Multiple Variants (1 file)

| File | Versions | Recommendation |
|------|----------|----------------|
| `code.tsx` | 4 unique | Pick largest, review diffs |

---

## TIER 3: Certificates (5 files)

### 100% Identical (2 files) - Extract to `@coursebuilder/ui/certificates`

| File | MD5 Hash |
|------|----------|
| `cohort-certificate.tsx` | 29ed11763c65f7cd2fb05348ee542439 |
| `module-certificate.tsx` | 831fea9c52c1723b076ec5f7a6ad564a |

### 4/5 Identical - epicdev-ai has different branding (3 files)

| File | 4-app MD5 | epicdev-ai MD5 |
|------|-----------|----------------|
| `background.tsx` | 3b40f958562977d5d010751dfe39a8a6 | ed854d48d777a90d2e4bc902b87ac163 |
| `logo.tsx` | 99d0ce1dc2f3c38695f66e78542c71d9 | ad17aff3d040c7b38db0a4483aa49585 |
| `signature.tsx` | 1a1f54dfd763b92805fba3cb8cf10cd3 | 7182c9a1680cda33ed510f45b61dfc57 |

**Strategy**: Extract base components with configurable branding via props/slots.

---

## TIER 4: List-editor (10 files)

### 100% Identical (4 files) - Extract to `@coursebuilder/ui/list-editor`

| File | MD5 Hash |
|------|----------|
| `draggable-item-renderer.tsx` | e084bc5aee76c281a594b0ff89187b8a |
| `resource-list.tsx` | bef53b3461e79d4477247385a3fe4cf9 |
| `search-config.tsx` | 57ad150ba939a3e87ca8351d487f65cc |
| `selection-context.tsx` | 63af7f40cd0a51b5f8f97cca7ce1a6e5 |

### 4/5 Identical (2 files)

| File | Outlier | Recommendation |
|------|---------|----------------|
| `dynamic-title.tsx` | epicdev-ai differs | Use 4-app version |
| `list-editor-config.ts` | ai-hero differs | Use 4-app version |

### Multiple Variants (3 files) - Pick largest

| File | ai-hero | dev-build | epicdev-ai | Use |
|------|---------|-----------|------------|-----|
| `hit.tsx` | = cwa | = jr | unique | Review all |
| `list-resources-edit.tsx` | unique | = jr | unique | Compare sizes |
| `resources-infinite-hits.tsx` | unique | = jr | unique | Compare sizes |

---

## TIER 5: Resources-crud (6 files)

### 100% Identical (4 files) - Extract to `@coursebuilder/ui/resources-crud`

| File | MD5 Hash |
|------|----------|
| `create-resource-page.tsx` | 4e8e3fc95c36792fc42fdaa57b31e9cc |
| `new-lesson-video-form.tsx` | 6384263a0542fbaa4546f0e23cdc3e54 |
| `video-upload-form-item.tsx` | 3232d5f7c1a97d7c7fdd4a776cd36f89 |
| `video-uploader.tsx` | 9be0a216df47da6bc304bc45a4d6293d |

### 4/5 Identical (1 file)

| File | Outlier | Recommendation |
|------|---------|----------------|
| `workshop-resources-edit.tsx` | epicdev-ai differs | Use 4-app version |

### Multiple Variants (1 file)

| File | Versions | Recommendation |
|------|----------|----------------|
| `new-resource-with-video-form.tsx` | 3 unique | Pick largest |

---

## TIER 6: Feedback-widget (3 files) - ALL 100% IDENTICAL

Extract entire directory to `@coursebuilder/ui/feedback-widget`:

| File | MD5 Hash |
|------|----------|
| `feedback-actions.ts` | 6fa51c82b268f92a835875c8bd4b7d75 |
| `feedback-insert.tsx` | d9f817b77f05a342480de2bb71bb6c2b |
| `use-feedback-form.ts` | 4aa759c61b06d5be9c8afd02e0cf2eb9 |

---

## TIER 7: Team-inquiry (3 files) - ALL 100% IDENTICAL

Extract entire directory to `@coursebuilder/ui/team-inquiry`:

| File | MD5 Hash |
|------|----------|
| `team-inquiry-actions.ts` | 27823eadb37eab4e6ccf800ce33420b3 |
| `team-inquiry-form.tsx` | 0ea0cb43b3054719a71ead4efe8ae081 |
| `team-inquiry-schema.ts` | 693e69c523472ddb85c3e75b739cbaf3 |

---

## TIER 8: Hooks (12 files)

> **Note**: This section overlaps with [03-hooks-extraction.md](./03-hooks-extraction.md).
> Refer to that document for the definitive hooks extraction plan.

### 100% Identical (5 files) - Extract to `@coursebuilder/next/hooks`

| File | MD5 Hash |
|------|----------|
| `use-is-mobile.ts` | 238d56565f5aa9316e60221c2f438b2e |
| `use-mux-player-prefs.ts` | 7eac892bcb5fe61fb83e6b24db301109 |
| `use-mutation-observer.ts` | 25caa64fdf6b306783fd695899ac5eea |
| `use-active-heading.tsx` | af7d668473fcccd71ee79387e23d38c6 |
| `use-transcript.tsx` | 31152e030a5e64ebd82789731b1c22d2 (4 apps) |

### 4/5 Identical (3 files)

| File | Outlier | Recommendation |
|------|---------|----------------|
| `use-mux-player.tsx` | epicdev-ai differs | Use 4-app version |
| `use-socket.ts` | epicdev-ai differs | Use 4-app version |
| `use-sale-toast-notifier.tsx` | ai-hero differs | Use 4-app version |

### Multiple Variants (1 file)

| File | Versions | Recommendation |
|------|----------|----------------|
| `use-convertkit-form.ts` | 3 unique | Compare sizes, pick largest |

---

## DO NOT EXTRACT (App-Specific/Branded)

These files vary intentionally by app:

### Navigation (app-specific branding)
- `navigation/footer.tsx` - All 5 different
- `navigation/user-menu.tsx` - All different
- `navigation/index.tsx` - App-specific nav structure

### Content/Layout (app-specific)
- `contributor.tsx` - Different contributor displays
- `layout-client.tsx` - App-specific layouts
- `login.tsx` - Different auth flows
- `share.tsx` - Different share patterns
- `cld-image.tsx` - Different Cloudinary configs
- `primary-newsletter-cta.tsx` - Different newsletter CTAs

### Commerce/Pricing (may vary by app)
- `commerce/*` - Some identical, some app-specific
- `pricing/*` - Mix of identical and app-specific

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. [ ] Extract 7 identical single files
2. [ ] Extract feedback-widget/ (3 files, 100% identical)
3. [ ] Extract team-inquiry/ (3 files, 100% identical)

### Phase 2: CodeHike (2-3 days)
1. [ ] Extract 10 identical codehike files
2. [ ] Review 2 outlier files, extract majority version
3. [ ] Handle code.tsx variants

### Phase 3: Resources & Forms (2-3 days)
1. [ ] Extract 4 identical resources-crud files
2. [ ] Extract 4 identical list-editor files
3. [ ] Review variant files, pick canonical versions

### Phase 4: Certificates (1-2 days)
1. [ ] Extract 2 identical certificate files
2. [ ] Make branding configurable via props
3. [ ] Handle epicdev-ai branding

### Phase 5: Hooks (1-2 days)
1. [ ] Extract 5 identical hooks
2. [ ] Review 3 outlier hooks, extract majority version
3. [ ] Handle use-convertkit-form variants

---

## Extraction Pattern

### For 100% identical files:
```typescript
// apps/ai-hero/src/components/spinner.tsx
export { Spinner } from '@coursebuilder/ui/spinner'
```

### For files with configurable branding:
```typescript
// packages/ui/src/certificates/background.tsx
export function CertificateBackground({
  variant = 'default'
}: { variant?: 'default' | 'epicdev' }) {
  // ...
}
```

---

## Verification Commands

```bash
# Verify component identity
md5 apps/*/src/components/spinner.tsx

# Check for drift in a file
wc -l apps/*/src/components/codehike/code.tsx

# Build all after extraction
pnpm build:all

# Type check
pnpm typecheck
```
