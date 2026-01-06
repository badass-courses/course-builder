# PR 2.4: Extract Common Hooks to @coursebuilder/next/hooks

## Overview
Extract commonly used React hooks to a shared package.

**Files touched**: 50+ files
**Risk**: LOW-MEDIUM
**Time estimate**: 4-5 hours

## Hooks to Extract (by priority)

| Hook | Copies | Identical? | Priority |
|------|--------|------------|----------|
| `use-is-mobile.ts` | 12 | ✅ 100% | HIGH |
| `use-mutation-observer.ts` | 7 | ✅ 100% | HIGH |
| `use-socket.ts` | 12 | 🔄 2 variants | MEDIUM |
| `use-convertkit-form.ts` | 8 | ✅ ~95% | MEDIUM |
| `use-transcript.tsx` | 10 | 🔄 2 variants | MEDIUM |
| `use-mux-player-prefs.ts` | 9 | ✅ ~90% | LOW (moved to provider) |

---

## Step 1: Create hooks in package

### packages/next/src/hooks/use-is-mobile.ts
```typescript
'use client'

import * as React from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Uses matchMedia API for efficient viewport detection.
 *
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

### packages/next/src/hooks/use-mutation-observer.ts
```typescript
'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to observe DOM mutations on a target element.
 *
 * @param targetEl - Element to observe, or null
 * @param config - MutationObserver configuration
 * @returns Latest MutationRecord or null
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

		return () => {
			observer.disconnect()
		}
	}, [targetEl, config])

	return mutation
}
```

### packages/next/src/hooks/use-socket.ts
```typescript
'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import PartySocket from 'partysocket'

export interface UseSocketOptions {
	room: string
	host?: string
}

export interface UseSocketResult {
	partySocket: PartySocket | null
}

/**
 * Hook to manage PartyKit WebSocket connections.
 * Automatically handles connection lifecycle and user identification.
 *
 * @param room - Room identifier for the socket connection
 * @param host - Optional PartyKit host URL
 */
export function useSocket({ room, host }: UseSocketOptions): UseSocketResult {
	const { data: session } = useSession()
	const [partySocket, setPartySocket] = React.useState<PartySocket | null>(null)

	React.useEffect(() => {
		const socket = new PartySocket({
			host: host ?? (process.env.NEXT_PUBLIC_PARTY_KIT_URL as string),
			room,
			id: session?.user?.id,
		})

		setPartySocket(socket)

		return () => {
			socket.close()
		}
	}, [host, room, session?.user?.id])

	return { partySocket }
}
```

### packages/next/src/hooks/use-convertkit-form.ts
```typescript
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

export interface ConvertKitFormConfig {
	submitUrl: string
	formId: string
	actionLabel?: string
	successMessage?: string
	errorMessage?: string
	fields?: Record<string, string>
	onSuccess?: (subscriber: ConvertKitSubscriber) => void
	onError?: (error: Error) => void
}

export interface ConvertKitSubscriber {
	id: number
	first_name: string
	email_address: string
	state: string
	fields: Record<string, any>
}

export interface UseConvertKitFormResult {
	isSubmitting: boolean
	status: 'idle' | 'loading' | 'success' | 'error'
	message: string | null
	handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
	inputProps: {
		name: string
		type: string
		required: boolean
	}
}

/**
 * Hook to handle ConvertKit form submissions.
 * Manages form state, submission, and success/error handling.
 */
export function useConvertKitForm(
	config: ConvertKitFormConfig,
): UseConvertKitFormResult {
	const router = useRouter()
	const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
	const [message, setMessage] = React.useState<string | null>(null)

	const handleSubmit = React.useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			setStatus('loading')
			setMessage(null)

			const formData = new FormData(e.currentTarget)
			const email = formData.get('email') as string

			try {
				const response = await fetch(config.submitUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						email,
						form_id: config.formId,
						fields: config.fields,
					}),
				})

				if (!response.ok) {
					throw new Error('Subscription failed')
				}

				const subscriber = await response.json()
				setStatus('success')
				setMessage(config.successMessage ?? 'Thanks for subscribing!')
				config.onSuccess?.(subscriber)
			} catch (error) {
				setStatus('error')
				setMessage(config.errorMessage ?? 'Something went wrong. Please try again.')
				config.onError?.(error as Error)
			}
		},
		[config],
	)

	return {
		isSubmitting: status === 'loading',
		status,
		message,
		handleSubmit,
		inputProps: {
			name: 'email',
			type: 'email',
			required: true,
		},
	}
}
```

### packages/next/src/hooks/use-transcript.ts
```typescript
'use client'

import * as React from 'react'

export interface TranscriptSegment {
	text: string
	startTime: number
	endTime: number
}

export interface UseTranscriptOptions {
	transcript: string | null
	currentTime?: number
}

export interface UseTranscriptResult {
	segments: TranscriptSegment[]
	activeSegmentIndex: number
	scrollToActiveSegment: () => void
}

/**
 * Hook to manage video transcript display and synchronization.
 * Parses transcript text and tracks the currently active segment based on video time.
 */
export function useTranscript({
	transcript,
	currentTime = 0,
}: UseTranscriptOptions): UseTranscriptResult {
	const [segments, setSegments] = React.useState<TranscriptSegment[]>([])
	const [activeSegmentIndex, setActiveSegmentIndex] = React.useState(0)
	const containerRef = React.useRef<HTMLDivElement>(null)

	// Parse transcript into segments
	React.useEffect(() => {
		if (!transcript) {
			setSegments([])
			return
		}

		// Simple parsing - assumes transcript has timing markers
		// This can be customized based on transcript format
		const parsed = parseTranscript(transcript)
		setSegments(parsed)
	}, [transcript])

	// Update active segment based on current time
	React.useEffect(() => {
		if (segments.length === 0) return

		const index = segments.findIndex(
			(segment) =>
				currentTime >= segment.startTime && currentTime < segment.endTime,
		)

		if (index !== -1 && index !== activeSegmentIndex) {
			setActiveSegmentIndex(index)
		}
	}, [currentTime, segments, activeSegmentIndex])

	const scrollToActiveSegment = React.useCallback(() => {
		const container = containerRef.current
		if (!container) return

		const activeElement = container.querySelector(`[data-segment="${activeSegmentIndex}"]`)
		activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
	}, [activeSegmentIndex])

	return {
		segments,
		activeSegmentIndex,
		scrollToActiveSegment,
	}
}

function parseTranscript(transcript: string): TranscriptSegment[] {
	// Basic implementation - can be expanded based on actual transcript format
	const lines = transcript.split('\n').filter(Boolean)
	return lines.map((text, index) => ({
		text,
		startTime: index * 5, // Placeholder timing
		endTime: (index + 1) * 5,
	}))
}
```

### packages/next/src/hooks/index.ts
```typescript
export { useIsMobile } from './use-is-mobile'
export { useMutationObserver } from './use-mutation-observer'
export { useSocket, type UseSocketOptions, type UseSocketResult } from './use-socket'
export {
	useConvertKitForm,
	type ConvertKitFormConfig,
	type ConvertKitSubscriber,
	type UseConvertKitFormResult,
} from './use-convertkit-form'
export {
	useTranscript,
	type TranscriptSegment,
	type UseTranscriptOptions,
	type UseTranscriptResult,
} from './use-transcript'
```

---

## Step 2: Update package.json exports

```json
{
  "exports": {
    "./hooks": {
      "types": "./hooks/index.d.ts",
      "import": "./hooks/index.js"
    }
  },
  "dependencies": {
    "partysocket": "^1.0.0"
  },
  "peerDependencies": {
    "next-auth": "5.0.0-beta.25"
  }
}
```

---

## Step 3: Update apps with re-exports

### apps/*/src/hooks/use-is-mobile.ts
```typescript
export { useIsMobile } from '@coursebuilder/next/hooks'
```

### apps/*/src/hooks/use-mutation-observer.ts
```typescript
export { useMutationObserver } from '@coursebuilder/next/hooks'
```

### apps/*/src/hooks/use-socket.ts
```typescript
export { useSocket, type UseSocketOptions, type UseSocketResult } from '@coursebuilder/next/hooks'
```

### apps/*/src/hooks/use-convertkit-form.ts
```typescript
export {
	useConvertKitForm,
	type ConvertKitFormConfig,
	type ConvertKitSubscriber,
	type UseConvertKitFormResult,
} from '@coursebuilder/next/hooks'
```

### apps/*/src/hooks/use-transcript.tsx
```typescript
export {
	useTranscript,
	type TranscriptSegment,
	type UseTranscriptOptions,
	type UseTranscriptResult,
} from '@coursebuilder/next/hooks'
```

---

## Step 4: Build and verify

```bash
cd packages/next
pnpm build

# From root
pnpm build:all
```

---

## Apps to update

### use-is-mobile.ts (12 apps)
- ai-hero, dev-build, epic-web, epicdev-ai, just-react
- egghead, epic-react, code-with-antonio, craft-of-ui
- go-local-first, course-builder-web, astro-party

### use-mutation-observer.ts (7 apps)
- ai-hero, dev-build, epic-web, epicdev-ai, just-react
- go-local-first, astro-party

### use-socket.ts (12 apps)
- All apps

### use-convertkit-form.ts (8 apps)
- ai-hero, dev-build, epic-web, epicdev-ai, just-react
- go-local-first, astro-party, code-with-antonio

### use-transcript.tsx (10 apps)
- ai-hero, dev-build, epic-web, epicdev-ai, just-react
- egghead, epic-react, course-builder-web, astro-party, go-local-first

---

## Success Criteria

- [ ] All hooks build in `packages/next`
- [ ] Mobile detection works
- [ ] Socket connections establish correctly
- [ ] ConvertKit forms submit successfully
- [ ] Transcript sync works with video
- [ ] All apps build successfully
