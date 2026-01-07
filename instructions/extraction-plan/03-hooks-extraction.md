# Hooks Extraction to @coursebuilder/next/hooks

## Overview

Extract shared React hooks to `@coursebuilder/next/hooks`.

**Active Apps**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Analysis Results

### 100% Identical (5 hooks - Extract immediately)

| Hook | MD5 Hash | Lines | @/ Deps |
|------|----------|-------|---------|
| `use-is-mobile.ts` | 238d56565f5aa9316e60221c2f438b2e | 23 | 0 |
| `use-mutation-observer.ts` | 25caa64fdf6b306783fd695899ac5eea | 20 | 0 |
| `use-mux-player-prefs.ts` | 7eac892bcb5fe61fb83e6b24db301109 | ~50 | 0 |
| `use-active-heading.tsx` | af7d668473fcccd71ee79387e23d38c6 | ~40 | 0 |
| `use-scroll-to-active.ts` | de626732d83cb918a0ac495e155574aa | ~30 | 0 |

### 4/5 Identical (3 hooks - ANALYZED)

| Hook | Outlier | Majority Hash | Recommendation |
|------|---------|---------------|----------------|
| `use-socket.ts` | epicdev-ai (`??` vs `||`) | a9a43bd83e35e46e2db1b681ed0223e4 | **Use epicdev-ai** (correct nullish coalescing) |
| `use-mux-player.tsx` | epicdev-ai | 902ffe4d62d0183413a6355a358af888 | Use 4-app version |
| `use-convertkit-form.ts` | 3 variants | 4d11e67c84beea5fae919b5321ca81a2 | Use dev-build cluster |

#### use-socket.ts Analysis

**4-app version (line 14)**:
```typescript
room: options.room || env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
```

**epicdev-ai version (line 14)**:
```typescript
room: options.room ?? env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
```

**Winner**: epicdev-ai - `??` is semantically correct for `room?: string | null` type signature. The `||` operator treats empty string as falsy which may cause unexpected fallback behavior.

### App-Specific (Keep in apps)

| Hook | Apps | Reason |
|------|------|--------|
| `use-confirm.tsx` | 4 | UI-specific confirmation dialog |
| `use-event-email-reminders.ts` | 4 | Domain-specific |
| `use-lesson-active-state.ts` | 3 | Domain-specific |
| `use-prefetch-next-resource.ts` | 4 | Uses `@/lib` queries |
| `use-resource-path.ts` | 3 | Uses `@/lib` |
| `use-sale-toast-notifier.tsx` | 4 | Uses `@/lib`, UI-specific |
| `use-transcript.tsx` | varies | Different implementations |

---

## Implementation

### Step 1: Create hooks directory

```bash
mkdir -p packages/next/src/hooks
```

### Step 2: Copy 100% identical hooks

#### packages/next/src/hooks/use-is-mobile.ts
```typescript
'use client'

import * as React from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile-sized.
 * @returns boolean indicating if viewport width is less than 768px
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
```

#### packages/next/src/hooks/use-mutation-observer.ts
```typescript
'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to observe DOM mutations on a target element.
 */
export function useMutationObserver(
  targetEl: HTMLElement | null,
  config: MutationObserverInit = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  },
) {
  const [mutation, setMutation] = useState<MutationRecord | null>(null)

  useEffect(() => {
    if (!targetEl) return
    const observer = new MutationObserver((mutationsList) => {
      setMutation(mutationsList[0] ?? null)
    })
    observer.observe(targetEl, config)
    return () => observer.disconnect()
  }, [targetEl, config])

  return mutation
}
```

#### packages/next/src/hooks/use-mux-player-prefs.ts
Copy from `apps/ai-hero/src/hooks/use-mux-player-prefs.ts`

#### packages/next/src/hooks/use-active-heading.tsx
Copy from `apps/ai-hero/src/hooks/use-active-heading.tsx`

#### packages/next/src/hooks/use-scroll-to-active.ts
Copy from `apps/ai-hero/src/hooks/use-scroll-to-active.ts`

### Step 3: Copy 4/5 identical hooks (majority versions)

#### packages/next/src/hooks/use-socket.ts
Copy from `apps/ai-hero/src/hooks/use-socket.ts` (majority version)

#### packages/next/src/hooks/use-convertkit-form.ts
Copy from `apps/dev-build/src/hooks/use-convertkit-form.ts` (majority version)

> **Note**: `use-mux-player.tsx` is extracted to `@coursebuilder/next/providers` as `MuxPlayerProvider` + `useMuxPlayer` hook.
> See [02-providers-extraction.md](./02-providers-extraction.md) for details.

### Step 4: Create index export

#### packages/next/src/hooks/index.ts
```typescript
'use client'

// 100% Identical
export { useIsMobile } from './use-is-mobile'
export { useMutationObserver } from './use-mutation-observer'
export { useMuxPlayerPrefs, type PlayerPrefs } from './use-mux-player-prefs'
export { useActiveHeading } from './use-active-heading'
export { useScrollToActive } from './use-scroll-to-active'

// 4/5 Identical (using majority version)
export { useSocket } from './use-socket'
export { useConvertKitForm } from './use-convertkit-form'

// NOTE: useMuxPlayer and MuxPlayerProvider are in @coursebuilder/next/providers
// See 02-providers-extraction.md for details
```

### Step 5: Update package.json exports

```json
{
  "exports": {
    "./hooks": {
      "types": "./hooks/index.d.ts",
      "import": "./hooks/index.js"
    }
  }
}
```

### Step 6: Update apps with re-exports

For each hook in all 5 active apps:

```typescript
// apps/*/src/hooks/use-is-mobile.ts
export { useIsMobile } from '@coursebuilder/next/hooks'

// apps/*/src/hooks/use-mutation-observer.ts
export { useMutationObserver } from '@coursebuilder/next/hooks'

// apps/*/src/hooks/use-mux-player-prefs.ts
export { useMuxPlayerPrefs, type PlayerPrefs } from '@coursebuilder/next/hooks'

// apps/*/src/hooks/use-active-heading.tsx
export { useActiveHeading } from '@coursebuilder/next/hooks'

// apps/*/src/hooks/use-scroll-to-active.ts
export { useScrollToActive } from '@coursebuilder/next/hooks'

// apps/*/src/hooks/use-socket.ts
export { useSocket } from '@coursebuilder/next/hooks'

// apps/*/src/hooks/use-mux-player.tsx
// NOTE: Re-export from providers, not hooks
export { useMuxPlayer, MuxPlayerProvider } from '@coursebuilder/next/providers'

// apps/*/src/hooks/use-convertkit-form.ts
export { useConvertKitForm } from '@coursebuilder/next/hooks'
```

---

## Verification

```bash
# Build package
cd packages/next && pnpm build

# Build all apps
pnpm build:all

# Typecheck
pnpm typecheck
```

---

## Success Criteria

- [ ] `packages/next` builds with hooks export
- [ ] All 5 active apps build successfully
- [ ] `useIsMobile` works in browser
- [ ] `useSocket` establishes PartyKit connections
- [ ] `useMuxPlayer` manages video player state
