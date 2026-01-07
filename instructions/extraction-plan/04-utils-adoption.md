# Utils Package Adoption

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Overview
Adopt existing utils packages and create new ones for remaining utilities.

---

## Adopt cn from @coursebuilder/ui - QUICK WIN

**Files touched**: 5 files (active apps only)
**Risk**: LOW

### Current State
- `cn` already exists in `@coursebuilder/ui/utils/cn`
- 5 copies in active apps
- Just need to update imports

### Steps

1. Replace `apps/*/src/utils/cn.ts`:
```typescript
// Re-export from UI package
export { cn } from '@coursebuilder/ui/utils/cn'
```

2. Build all apps:
```bash
pnpm build:all
```

### Apps to update
Active apps only: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

**Note**: No new package needed - `cn` already exists in `@coursebuilder/ui`.

---

## Adopt utils-core (guid.ts) - QUICK WIN

**Files touched**: 5 files (active apps only)
**Risk**: LOW

### Steps

1. Add dependency to each app's `package.json`:
```json
"@coursebuilder/utils-core": "1.0.0"
```

2. Replace `apps/*/src/utils/guid.ts`:
```typescript
// Re-export from shared package
export { guid } from '@coursebuilder/utils-core/guid'
```

3. Build all apps:
```bash
pnpm build:all
```

---

## Adopt utils-email (send-an-email.ts) - QUICK WIN

**Files touched**: 5 files (active apps only)
**Risk**: LOW

### Steps

1. Add dependency to each app's `package.json`:
```json
"@coursebuilder/utils-email": "1.0.2"
```

2. Replace `apps/*/src/utils/send-an-email.ts`:
```typescript
// Re-export from shared package
export { sendAnEmail } from '@coursebuilder/utils-email/send-an-email'
```

3. Build and test email sending:
```bash
pnpm build:all
# Test in dev: verify email preview works
```

---

## Create utils-discord - NEW PACKAGE

**Files touched**: 6 files (5 active apps + new package)
**Risk**: LOW

### Step 1: Create package with plop
```bash
pnpm plop package-utils discord discord sendDiscordMessage "Discord API utilities"
```

### Step 2: Copy implementation

Create `packages/utils-discord/src/discord.ts`:
```typescript
/**
 * Discord API utilities for role management and notifications.
 */

export interface DiscordConfig {
	botToken: string
	guildId: string
}

export interface DiscordRole {
	id: string
	name: string
}

/**
 * Add a role to a Discord user.
 */
export async function addDiscordRole(
	config: DiscordConfig,
	userId: string,
	roleId: string,
): Promise<void> {
	const response = await fetch(
		`https://discord.com/api/v10/guilds/${config.guildId}/members/${userId}/roles/${roleId}`,
		{
			method: 'PUT',
			headers: {
				Authorization: `Bot ${config.botToken}`,
			},
		},
	)

	if (!response.ok) {
		throw new Error(`Failed to add Discord role: ${response.statusText}`)
	}
}

/**
 * Remove a role from a Discord user.
 */
export async function removeDiscordRole(
	config: DiscordConfig,
	userId: string,
	roleId: string,
): Promise<void> {
	const response = await fetch(
		`https://discord.com/api/v10/guilds/${config.guildId}/members/${userId}/roles/${roleId}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bot ${config.botToken}`,
			},
		},
	)

	if (!response.ok) {
		throw new Error(`Failed to remove Discord role: ${response.statusText}`)
	}
}

/**
 * Get Discord member info.
 */
export async function getDiscordMember(
	config: DiscordConfig,
	userId: string,
): Promise<any> {
	const response = await fetch(
		`https://discord.com/api/v10/guilds/${config.guildId}/members/${userId}`,
		{
			headers: {
				Authorization: `Bot ${config.botToken}`,
			},
		},
	)

	if (!response.ok) {
		throw new Error(`Failed to get Discord member: ${response.statusText}`)
	}

	return response.json()
}

/**
 * Send a Discord webhook message.
 */
export async function sendDiscordWebhook(
	webhookUrl: string,
	message: {
		content?: string
		embeds?: Array<{
			title?: string
			description?: string
			color?: number
			fields?: Array<{ name: string; value: string; inline?: boolean }>
		}>
	},
): Promise<void> {
	const response = await fetch(webhookUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(message),
	})

	if (!response.ok) {
		throw new Error(`Failed to send Discord webhook: ${response.statusText}`)
	}
}
```

### Step 3: Update package.json exports
```json
{
  "name": "@coursebuilder/utils-discord",
  "exports": {
    "./discord": {
      "types": "./dist/discord.d.ts",
      "import": "./dist/discord.js"
    }
  }
}
```

### Step 4: Build package
```bash
cd packages/utils-discord
pnpm build
```

### Step 5: Update apps

Replace `apps/*/src/utils/discord.ts` (8 apps):
```typescript
// Re-export from shared package
export {
	addDiscordRole,
	removeDiscordRole,
	getDiscordMember,
	sendDiscordWebhook,
	type DiscordConfig,
	type DiscordRole,
} from '@coursebuilder/utils-discord/discord'
```

### Apps to update (Active Only)
- ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Expand utils-media (cloudinary.ts)

**Files touched**: 5 files (active apps only)
**Risk**: LOW

### Step 1: Add to existing package

Create `packages/utils-media/src/cloudinary.ts`:
```typescript
/**
 * Cloudinary utilities for image transformation and upload.
 */

export interface CloudinaryConfig {
	cloudName: string
	apiKey?: string
	apiSecret?: string
}

/**
 * Generate a Cloudinary URL with transformations.
 */
export function getCloudinaryUrl(
	config: CloudinaryConfig,
	publicId: string,
	transformations: string[] = [],
): string {
	const baseUrl = `https://res.cloudinary.com/${config.cloudName}/image/upload`
	const transformString = transformations.length > 0 ? `${transformations.join('/')}/` : ''
	return `${baseUrl}/${transformString}${publicId}`
}

/**
 * Generate an optimized image URL.
 */
export function getOptimizedImageUrl(
	config: CloudinaryConfig,
	publicId: string,
	options: {
		width?: number
		height?: number
		quality?: 'auto' | number
		format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
	} = {},
): string {
	const transformations: string[] = []

	if (options.width) transformations.push(`w_${options.width}`)
	if (options.height) transformations.push(`h_${options.height}`)
	transformations.push(`q_${options.quality ?? 'auto'}`)
	transformations.push(`f_${options.format ?? 'auto'}`)

	return getCloudinaryUrl(config, publicId, transformations)
}
```

### Step 2: Update package exports

Add to `packages/utils-media/package.json`:
```json
{
  "exports": {
    "./video-resource": { ... },
    "./cloudinary": {
      "types": "./dist/cloudinary.d.ts",
      "import": "./dist/cloudinary.js"
    }
  }
}
```

### Step 3: Update tsup config
```typescript
export default defineConfig({
  entry: ['src/video-resource.ts', 'src/cloudinary.ts'],
  // ...
})
```

### Step 4: Update apps

Replace `apps/*/src/utils/cloudinary.ts`:
```typescript
export {
	getCloudinaryUrl,
	getOptimizedImageUrl,
	type CloudinaryConfig,
} from '@coursebuilder/utils-media/cloudinary'
```

---

## Adopt remaining utils packages

**Files touched**: ~20 files (active apps only)
**Risk**: LOW

### utils-string (chicagor-title.ts)
```typescript
// apps/*/src/utils/chicagor-title.ts
export { toChicagoTitleCase } from '@coursebuilder/utils-string/chicagor-title'
```
Active apps: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

### utils-resource (filter-resources.ts)
```typescript
// apps/*/src/utils/filter-resources.ts
export { filterResources } from '@coursebuilder/utils-resource/filter-resources'
```
Active apps: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

### utils-browser (cookies.ts)
```typescript
// apps/*/src/utils/cookies.ts
export { default as cookieUtil } from '@coursebuilder/utils-browser/cookies'
```
Active apps: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

### utils-search (typesense-instantsearch-adapter.ts)
```typescript
// apps/*/src/utils/typesense-instantsearch-adapter.ts
export {
	createTypesenseAdapter,
	createDefaultConfig,
	getTypesenseCollectionName,
} from '@coursebuilder/utils-search/typesense-adapter'
```
Active apps: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Success Criteria

- [ ] All utils packages build successfully
- [ ] `cn()` works for Tailwind class merging
- [ ] `guid()` generates unique IDs
- [ ] Email sending works
- [ ] Discord integration works
- [ ] Cloudinary URLs generate correctly
- [ ] All apps build successfully
- [ ] All apps pass typecheck
