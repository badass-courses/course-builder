# PR 2.1-2.3: Extract Providers to @coursebuilder/next/providers

## Overview
Extract `ThemeProvider`, `AmplitudeProvider`, and `MuxPlayerProvider` to shared package.

## PR 2.1: ThemeProvider

**Files touched**: 13 files
**Risk**: LOW
**Time estimate**: 1-2 hours

### Step 1: Create provider in package

Create `packages/next/src/providers/theme-provider.tsx`:
```typescript
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

/**
 * Theme provider wrapper around next-themes.
 * Provides dark/light mode support.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### Step 2: Create index export

Create `packages/next/src/providers/index.ts`:
```typescript
export { ThemeProvider } from './theme-provider'
```

### Step 3: Update package.json exports

```json
{
  "exports": {
    "./providers": {
      "types": "./providers/index.d.ts",
      "import": "./providers/index.js"
    }
  },
  "dependencies": {
    "next-themes": "^0.3.0"
  }
}
```

### Step 4: Update all apps

Replace `apps/*/src/components/theme-provider.tsx` (12 apps):
```typescript
// Re-export from shared package
export { ThemeProvider } from '@coursebuilder/next/providers'
```

---

## PR 2.2: AmplitudeProvider

**Files touched**: 10 files
**Risk**: MEDIUM (config injection needed)
**Time estimate**: 2-3 hours

### Step 1: Create provider with config injection

Create `packages/next/src/providers/amplitude-provider.tsx`:
```typescript
'use client'

import * as React from 'react'
import { createContext, useContext, useEffect } from 'react'
import { init, setUserId, track } from '@amplitude/analytics-browser'
import { useSession } from 'next-auth/react'

export interface AmplitudeConfig {
	apiKey: string | undefined
}

interface AmplitudeContextType {
	trackAmplitudeEvent: (eventName: string, eventProperties: Record<string, any>) => void
}

const AmplitudeContext = createContext<AmplitudeContextType>({
	trackAmplitudeEvent: () => {},
})

/**
 * Hook to access Amplitude tracking functions.
 */
export function useAmplitude() {
	return useContext(AmplitudeContext)
}

interface AmplitudeProviderProps {
	children: React.ReactNode
	config: AmplitudeConfig
}

/**
 * Amplitude analytics provider.
 * Initializes Amplitude with the provided API key and tracks user sessions.
 */
export function AmplitudeProvider({ children, config }: AmplitudeProviderProps) {
	const { data: session, status } = useSession()
	const userEmail = session?.user?.email

	useEffect(() => {
		if (config.apiKey) {
			init(config.apiKey, userEmail ? userEmail : undefined, {
				defaultTracking: {
					sessions: true,
				},
			})
		}
	}, [config.apiKey, userEmail])

	useEffect(() => {
		if (config.apiKey && status === 'authenticated') {
			setUserId(userEmail ? userEmail : undefined)
		}
	}, [config.apiKey, status, userEmail])

	const trackAmplitudeEvent = React.useCallback(
		(eventName: string, eventProperties: Record<string, any>) => {
			if (config.apiKey) {
				track(eventName, eventProperties)
			}
		},
		[config.apiKey],
	)

	const value = React.useMemo(
		() => ({ trackAmplitudeEvent }),
		[trackAmplitudeEvent],
	)

	return (
		<AmplitudeContext.Provider value={value}>
			{children}
		</AmplitudeContext.Provider>
	)
}
```

### Step 2: Update index export

```typescript
export { ThemeProvider } from './theme-provider'
export { AmplitudeProvider, useAmplitude, type AmplitudeConfig } from './amplitude-provider'
```

### Step 3: Update apps with config injection

Replace `apps/*/src/components/amplitude-provider.tsx`:
```typescript
'use client'

import { AmplitudeProvider as BaseAmplitudeProvider } from '@coursebuilder/next/providers'
import { env } from '@/env.mjs'

export default function AmplitudeContextProvider({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<BaseAmplitudeProvider
			config={{ apiKey: env.NEXT_PUBLIC_AMPLITUDE_API_KEY }}
		>
			{children}
		</BaseAmplitudeProvider>
	)
}

// Re-export hook for convenience
export { useAmplitude } from '@coursebuilder/next/providers'
```

---

## PR 2.3: MuxPlayerProvider

**Files touched**: 10+ files
**Risk**: MEDIUM (3 variants need unification)
**Time estimate**: 3-4 hours

### Step 1: Create unified provider

Create `packages/next/src/providers/mux-player-provider.tsx`:
```typescript
'use client'

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'

export interface PlayerPrefs {
	volume: number
	playbackRate: number
	autoplay: boolean
	subtitle: {
		language: string | null
		mode: TextTrackMode
	}
	muted: boolean
	theater: boolean
	defaultView: 'transcript' | 'resources' | 'notes' | 'comments'
	activeSidebarTab: number
}

export const defaultPlayerPreferences: PlayerPrefs = {
	volume: 1,
	playbackRate: 1,
	autoplay: false,
	subtitle: {
		language: null,
		mode: 'disabled',
	},
	muted: false,
	theater: false,
	defaultView: 'transcript',
	activeSidebarTab: 0,
}

interface MuxPlayerContextType {
	setMuxPlayerRef: React.Dispatch<
		React.SetStateAction<React.RefObject<MuxPlayerRefAttributes | null> | null>
	>
	muxPlayerRef: React.RefObject<MuxPlayerRefAttributes | null> | null
	playerPrefs: PlayerPrefs
	setPlayerPrefs: (options: Partial<PlayerPrefs>) => void
}

const MuxPlayerContext = createContext<MuxPlayerContextType | undefined>(undefined)

const PLAYER_PREFS_KEY = 'mux-player-prefs'

function getPlayerPrefs(): PlayerPrefs {
	if (typeof window === 'undefined') return defaultPlayerPreferences
	try {
		const stored = localStorage.getItem(PLAYER_PREFS_KEY)
		if (stored) {
			return { ...defaultPlayerPreferences, ...JSON.parse(stored) }
		}
	} catch {
		// Ignore parse errors
	}
	return defaultPlayerPreferences
}

function savePlayerPrefs(options: Partial<PlayerPrefs>): PlayerPrefs {
	const current = getPlayerPrefs()
	const newPrefs = { ...current, ...options }
	if (typeof window !== 'undefined') {
		localStorage.setItem(PLAYER_PREFS_KEY, JSON.stringify(newPrefs))
	}
	return newPrefs
}

/**
 * Provider component that manages Mux Player state and preferences.
 * Handles player reference, volume, playback rate, subtitles, and UI preferences.
 */
export function MuxPlayerProvider({ children }: { children: React.ReactNode }) {
	const [muxPlayerRef, setMuxPlayerRef] =
		useState<React.RefObject<MuxPlayerRefAttributes | null> | null>(null)

	const [playerPrefs, setPlayerPrefsState] = useState<PlayerPrefs>(defaultPlayerPreferences)
	const [isInitialized, setIsInitialized] = useState(false)

	useEffect(() => {
		if (!isInitialized) {
			const prefs = getPlayerPrefs()
			setPlayerPrefsState(prefs)
			setIsInitialized(true)
		}
	}, [isInitialized])

	const setPlayerPrefs = useCallback((options: Partial<PlayerPrefs>) => {
		const newPrefs = savePlayerPrefs(options)
		setPlayerPrefsState(newPrefs)
	}, [])

	const value = useMemo(
		() => ({
			muxPlayerRef,
			setMuxPlayerRef,
			playerPrefs,
			setPlayerPrefs,
		}),
		[muxPlayerRef, playerPrefs, setPlayerPrefs],
	)

	return (
		<MuxPlayerContext.Provider value={value}>
			{children}
		</MuxPlayerContext.Provider>
	)
}

/**
 * Hook to access Mux Player state and preferences.
 * Must be used within a MuxPlayerProvider.
 */
export function useMuxPlayer() {
	const context = useContext(MuxPlayerContext)
	if (!context) {
		throw new Error('useMuxPlayer must be used within a MuxPlayerProvider')
	}
	return context
}
```

### Step 2: Update index export

```typescript
export { ThemeProvider } from './theme-provider'
export { AmplitudeProvider, useAmplitude, type AmplitudeConfig } from './amplitude-provider'
export {
	MuxPlayerProvider,
	useMuxPlayer,
	defaultPlayerPreferences,
	type PlayerPrefs,
} from './mux-player-provider'
```

### Step 3: Update apps

Replace `apps/*/src/hooks/use-mux-player.tsx`:
```typescript
// Re-export from shared package
export {
	MuxPlayerProvider,
	useMuxPlayer,
	defaultPlayerPreferences,
	type PlayerPrefs,
} from '@coursebuilder/next/providers'
```

Delete `apps/*/src/lib/mux-player-prefs.ts` if it exists (logic now in provider).

---

## Success Criteria

- [ ] All providers build in `packages/next`
- [ ] Theme switching works in all apps
- [ ] Amplitude events fire correctly
- [ ] Mux player preferences persist across page loads
- [ ] All apps build successfully
