# PR #673 Review: Products CRUD with Sync to Original DB

> **Branch**: `vojta/ew-205-products-crud-in-ewd-builder-syncing-to-the-og-db`
> **Changes**: +1797 / -43 | 19 files
> **Reviewed**: 2026-02-03

## Summary

Adds product management to epic-web admin:
- Product list, create, and edit pages
- Sync utility to mirror `zEW_` prefixed tables to original tables
- Auto-sync on Product CRUD operations
- Section editing dialog for content management
- Free tier option added to tier selector

---

## Critical Issues

### 1. Missing Transaction Safety (`sync-products.ts`)

`syncProductToOriginal()` performs 4 separate DB operations without a transaction wrapper:

```
Product → MerchantProduct → MerchantPrice → Prices
```

If operation #2 fails after #1 succeeds, data becomes inconsistent between source and target tables.

**Recommendation**: Wrap in `db.transaction()`

### 2. Route Path Inconsistencies

| File | Current | Should Be |
|------|---------|-----------|
| `products/page.tsx:24` | `/products/new` | `/admin/products/new` |
| `products/new/page.tsx:22` | `/products/${slug}/edit` | `/admin/products/${slug}/edit` |
| `actions.ts:9` | `/products/${slug}` | `/admin/products/${slug}` |

### 3. Form Validation Bypass (`edit-product-form.tsx:544`)

```typescript
// Current (skips Zod validation):
onSubmit={() => onSubmit(form.getValues())}

// Should be:
onSubmit={form.handleSubmit(onSubmit)}
```

### 4. No Error Handling on Save (`edit-product-form.tsx`)

```typescript
const onSubmit = async (values) => {
  const updatedResource = await updateResource(values)
  // No try/catch - errors silently fail
}
```

---

## Warnings

| Issue | File | Line | Notes |
|-------|------|------|-------|
| Unused import | `sync-products.ts` | 3 | `import type { table }` never used |
| Console.log in prod | `edit-product-form.tsx` | 467 | Remove debug statement |
| Commented code | `edit-product-form.tsx` | 127-132 | Check mark UI commented out |
| `as any` casts | `edit-product-form.tsx` | 182, 212 | Bypasses type safety |
| Auth inconsistency | Admin pages | - | Uses `create` check for edit page |
| Nested metadata lost | `tree.tsx` | 226 | Updates don't propagate tier info |
| Dual update path | Section edits | - | Dialog writes DB directly, bypasses tree state |
| No loading states | Save buttons | - | Multiple clicks = race conditions |

---

## Suggestions

- Add pagination to `syncProductsToOriginal()` for large datasets
- Cache `isWithinFreeTierSection` lookup at TreeContext level
- Extract action bar button logic to hooks for loading states
- Document timezone handling for enrollment dates
- Add logging to sync operations for debugging

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCT CRUD FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Admin Pages                    Data Layer                  │
│  ───────────                    ──────────                  │
│  /admin/products ────────────▶ products-query.ts            │
│       │                              │                      │
│       ├── /new                       │                      │
│       │     └─▶ createProduct ───────┼──▶ sync-products.ts  │
│       │                              │         │            │
│       └── /[slug]/edit               │         ▼            │
│             └─▶ updateProduct ───────┼──▶ Original DB       │
│                  archiveProduct ─────┘    (no zEW_ prefix)  │
│                                                             │
│  Tree Components                                            │
│  ───────────────                                            │
│  tree.tsx ──────▶ Nested section support (recursive)        │
│  tree-item.tsx ──▶ Free tier detection + section editing    │
│  edit-section-dialog.tsx ──▶ Section metadata modal         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Good

- Tier expansion (`free | standard | premium | vip`) is type-consistent across all files
- Nested section support is properly recursive
- UPSERT pattern for sync is correct (`onDuplicateKeyUpdate`)
- Section dialog has proper Zod validation + loading spinner
- Drop target logic simplification improves clarity

---

## Verdict

**Needs attention before merge.** Fix critical routing issues and add transaction wrapper. The sync logic and tree changes are solid otherwise.
