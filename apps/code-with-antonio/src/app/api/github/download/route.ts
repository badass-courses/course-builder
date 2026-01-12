import { NextRequest, NextResponse } from 'next/server'
import { fetchGithubZipball, parseGithubRepo } from '@/lib/github'
import { getCachedMinimalWorkshop } from '@/lib/workshops-query'
import { log } from '@/server/logger'
import { getAbilityForResource } from '@/utils/get-current-ability-rules'

/**
 * GET /api/github/download
 *
 * Downloads source code from a private GitHub repository as a zip file.
 * Requires the user to have purchased source code access (not just free view access).
 *
 * Query Parameters:
 * - workshop: The workshop slug (required)
 * - ref: Git reference (branch/tag/commit) - optional, defaults to default branch
 *
 * @example
 * GET /api/github/download?workshop=my-workshop
 * GET /api/github/download?workshop=my-workshop&ref=main
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const workshopSlug = searchParams.get('workshop')
	const ref = searchParams.get('ref') || undefined

	// Validate workshop slug
	if (!workshopSlug) {
		await log.warn('github.download.missing_workshop_slug', {})
		return NextResponse.json(
			{ error: 'Missing workshop parameter' },
			{ status: 400 },
		)
	}

	// Get workshop and verify it has a private repo configured
	const workshop = await getCachedMinimalWorkshop(workshopSlug)

	if (!workshop) {
		await log.warn('github.download.workshop_not_found', {
			workshopSlug,
		})
		return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
	}

	const privateGithubRepo = workshop.fields?.privateGithubRepo

	if (!privateGithubRepo) {
		await log.warn('github.download.no_private_repo', {
			workshopSlug,
			workshopId: workshop.id,
		})
		return NextResponse.json(
			{ error: 'No source code available for this workshop' },
			{ status: 404 },
		)
	}

	// Check user entitlement - requires purchased access (not just free view access)
	const ability = await getAbilityForResource(undefined, workshopSlug)

	if (!ability.canDownloadSourceCode) {
		await log.warn('github.download.access_denied', {
			workshopSlug,
			workshopId: workshop.id,
		})
		return NextResponse.json(
			{ error: 'You do not have access to this source code' },
			{ status: 403 },
		)
	}

	// Parse and validate the repo string
	let owner: string
	let repo: string

	try {
		const parsed = parseGithubRepo(privateGithubRepo)
		owner = parsed.owner
		repo = parsed.repo
	} catch (error) {
		await log.error('github.download.invalid_repo_format', {
			workshopSlug,
			workshopId: workshop.id,
			privateGithubRepo,
			error: error instanceof Error ? error.message : String(error),
		})
		return NextResponse.json(
			{ error: 'Invalid repository configuration' },
			{ status: 500 },
		)
	}

	// Fetch zipball from GitHub
	try {
		const githubResponse = await fetchGithubZipball(owner, repo, ref)

		await log.info('github.download.success', {
			workshopSlug,
			workshopId: workshop.id,
			owner,
			repo,
			ref: ref || 'default',
		})

		// Stream the response back to the user
		return new NextResponse(githubResponse.body, {
			status: 200,
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${repo}-source-code.zip"`,
				// Pass through content-length if available
				...(githubResponse.headers.get('content-length') && {
					'Content-Length': githubResponse.headers.get('content-length')!,
				}),
			},
		})
	} catch (error) {
		await log.error('github.download.fetch_failed', {
			workshopSlug,
			workshopId: workshop.id,
			owner,
			repo,
			ref: ref || 'default',
			error: error instanceof Error ? error.message : String(error),
		})

		return NextResponse.json(
			{ error: 'Failed to download source code' },
			{ status: 500 },
		)
	}
}
