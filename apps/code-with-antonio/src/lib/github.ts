import { log } from '@/server/logger'

/**
 * Fetches a repository zipball from GitHub using a private access token.
 * This proxies the request through our server to protect the token and enforce entitlements.
 *
 * @param owner - The repository owner (user or organization)
 * @param repo - The repository name
 * @param ref - The git reference (branch, tag, or commit SHA). Defaults to default branch.
 * @returns Response object with the zip stream
 * @throws Error if the fetch fails or token is not configured
 */
export async function fetchGithubZipball(
	owner: string,
	repo: string,
	ref?: string,
): Promise<Response> {
	const token = process.env.GITHUB_PRIVATE_REPO_TOKEN

	if (!token) {
		await log.error('github.zipball.missing_token', {
			owner,
			repo,
		})
		throw new Error('GitHub private repo token is not configured')
	}

	const url = ref
		? `https://api.github.com/repos/${owner}/${repo}/zipball/${ref}`
		: `https://api.github.com/repos/${owner}/${repo}/zipball`

	await log.info('github.zipball.fetch_start', {
		owner,
		repo,
		ref: ref || 'default',
	})

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
	})

	if (!response.ok) {
		await log.error('github.zipball.fetch_failed', {
			owner,
			repo,
			ref: ref || 'default',
			status: response.status,
			statusText: response.statusText,
		})
		throw new Error(
			`Failed to fetch GitHub zipball: ${response.status} ${response.statusText}`,
		)
	}

	await log.info('github.zipball.fetch_success', {
		owner,
		repo,
		ref: ref || 'default',
		contentLength: response.headers.get('content-length'),
	})

	return response
}

/**
 * Parses a "owner/repo" string into its components.
 * Validates the format to prevent path traversal or invalid repo references.
 *
 * @param repoString - String in format "owner/repo"
 * @returns Object with owner and repo properties
 * @throws Error if format is invalid
 */
export function parseGithubRepo(repoString: string): {
	owner: string
	repo: string
} {
	const parts = repoString.split('/')

	if (parts.length !== 2) {
		throw new Error(
			`Invalid GitHub repo format: "${repoString}". Expected "owner/repo".`,
		)
	}

	const [owner, repo] = parts

	// Basic validation to prevent path traversal
	if (
		!owner ||
		!repo ||
		owner.includes('.') ||
		repo.includes('.') ||
		owner.includes('/') ||
		repo.includes('/')
	) {
		throw new Error(`Invalid GitHub repo format: "${repoString}"`)
	}

	return { owner, repo }
}
