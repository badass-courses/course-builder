# Ability (Authorization) Extraction Plan

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Overview

Extract CASL-based authorization logic to shared package.

**Target**: `@coursebuilder/core/ability` or `@coursebuilder/next/ability`

---

## Analysis Results
****
### 100% Identical (1 file - Extract immediately)

| File | MD5 Hash | Purpose |
|------|----------|---------|
| `ability/purchase-validators.ts` | (verify) | Purchase validation logic |

### Multiple Variants (1 file)

| File | Variants | Description |
|------|----------|-------------|
| `ability/index.ts` | 2 variants | ai-hero/epicdev-ai vs dev-build cluster |

---

## File Analysis

### purchase-validators.ts

100% identical across all 5 active apps. Contains:
- `isPurchaseActive()` - Check if purchase is active
- `hasPurchasedProduct()` - Check product ownership
- `hasActiveSubscription()` - Check subscription status

**Action**: Extract directly to shared package.

### ability/index.ts

Two variant clusters:

**Cluster 1**: ai-hero, epicdev-ai
- More complex rules
- Live event permissions
- Cohort access rules

**Cluster 2**: dev-build, just-react, code-with-antonio
- Simpler rules
- Standard content permissions

**Recommendation**: Use ai-hero version (most complete), ensure it's backward compatible.

---

## Implementation

### Step 1: Extract purchase-validators.ts

```typescript
// packages/core/src/ability/purchase-validators.ts
import type { Purchase } from '@coursebuilder/core/types'

export function isPurchaseActive(purchase: Purchase | null): boolean {
  if (!purchase) return false
  return purchase.status === 'Valid' || purchase.status === 'Restricted'
}

export function hasPurchasedProduct(
  purchases: Purchase[],
  productId: string
): boolean {
  return purchases.some(
    (p) => p.productId === productId && isPurchaseActive(p)
  )
}

export function hasActiveSubscription(
  purchases: Purchase[]
): boolean {
  return purchases.some(
    (p) => p.status === 'Valid' && p.merchantChargeId?.startsWith('sub_')
  )
}
```

### Step 2: Update package exports

```json
{
  "exports": {
    "./ability": {
      "types": "./ability/index.d.ts",
      "import": "./ability/index.js"
    }
  }
}
```

### Step 3: Update apps with re-exports

```typescript
// apps/*/src/ability/purchase-validators.ts
export {
  isPurchaseActive,
  hasPurchasedProduct,
  hasActiveSubscription,
} from '@coursebuilder/core/ability'
```

---

## ability/index.ts Strategy

Due to variants, keep in apps but document canonical version.

### Canonical Version: ai-hero

The ai-hero version has the most complete rule set including:
- Content permissions (create, read, update, delete)
- Purchase permissions
- Cohort access rules
- Live event permissions

### Sync Process

When updating ability rules:

1. Make changes in ai-hero
2. Test with `pnpm --filter="ai-hero" build`
3. Copy relevant rules to other apps
4. Verify all apps build

---

## Verification

```bash
# Compare ability files
md5 apps/*/src/ability/purchase-validators.ts
md5 apps/*/src/ability/index.ts

# Build all apps
pnpm build:all
```

---

## Success Criteria

- [ ] `purchase-validators.ts` extracted to `@coursebuilder/core/ability`
- [ ] All 5 active apps build successfully
- [ ] Authorization rules work correctly
- [ ] Canonical version documented for `ability/index.ts`
