import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { log } from '@/server/logger'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Mux API response schema for playback-ids endpoint
 */
const MuxPlaybackIdResponseSchema = z.object({
	data: z.object({
		id: z.string(),
		policy: z.string(),
		object: z.object({
			id: z.string(),
			type: z.string(),
		}),
	}),
})

/**
 * Mux static rendition file schema
 */
const MuxStaticRenditionFileSchema = z.object({
	name: z.string(),
	ext: z.string(),
	width: z.number().optional(),
	height: z.number().optional(),
	bitrate: z.number().optional(),
	filesize: z.string().optional(),
	type: z.string().optional(),
	status: z.string().optional(),
	resolution: z.string().optional(),
	resolution_tier: z.string().optional(),
	id: z.string().optional(),
})

/**
 * Mux API response schema for assets endpoint
 */
const MuxAssetResponseSchema = z.object({
	data: z.object({
		id: z.string(),
		status: z.string(),
		duration: z.number().optional(),
		static_renditions: z
			.object({
				files: z.array(MuxStaticRenditionFileSchema).optional(),
			})
			.optional(),
	}),
})

/**
 * Download option schema
 */
const DownloadSchema = z.object({
	quality: z.string(),
	url: z.string(),
	width: z.number().optional(),
	height: z.number().optional(),
	bitrate: z.number().optional(),
	filesize: z.number().optional(),
})

/**
 * API response schema
 */
const VideoResponseSchema = z.object({
	playbackId: z.string(),
	assetId: z.string(),
	status: z.string(),
	duration: z.number().optional(),
	downloads: z.array(DownloadSchema),
})

export type VideoResponse = z.infer<typeof VideoResponseSchema>

const MUX_AUTH = Buffer.from(
	`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`,
).toString('base64')

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/video/[playbackId]
 *
 * Returns Mux video download URLs for a given playback ID.
 * Validates that the playbackId exists in the database before
 * fetching asset details from Mux API.
 */
export async function GET(
	request: NextRequest,
	props: { params: Promise<{ playbackId: string }> },
) {
	const params = await props.params
	const { playbackId } = params

	await log.info('api.video.downloads.started', { playbackId })

	if (!playbackId) {
		return NextResponse.json(
			{ error: 'playbackId is required' },
			{ status: 400, headers: corsHeaders },
		)
	}

	try {
		// 1. Validate playbackId exists in database
		const videoResource = await db.query.contentResource.findFirst({
			where: and(
				eq(contentResource.type, 'videoResource'),
				isNull(contentResource.deletedAt),
				eq(
					sql`JSON_UNQUOTE(JSON_EXTRACT(${contentResource.fields}, '$.muxPlaybackId'))`,
					playbackId,
				),
			),
			columns: { id: true },
		})

		if (!videoResource) {
			await log.warn('api.video.downloads.not_found', { playbackId })
			return NextResponse.json(
				{ error: 'Video not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		// 2. Fetch from Mux: playback-ids endpoint
		const playbackRes = await fetch(
			`https://api.mux.com/video/v1/playback-ids/${playbackId}`,
			{ headers: { Authorization: `Basic ${MUX_AUTH}` } },
		)

		if (!playbackRes.ok) {
			const errorText = await playbackRes.text()
			await log.error('api.video.downloads.mux_playback_error', {
				playbackId,
				status: playbackRes.status,
				error: errorText,
			})
			return NextResponse.json(
				{ error: 'Failed to fetch from Mux API' },
				{ status: 500, headers: corsHeaders },
			)
		}

		const playbackJson = await playbackRes.json()
		const playbackData = MuxPlaybackIdResponseSchema.parse(playbackJson)

		// 3. Fetch from Mux: assets endpoint using object.id
		const assetId = playbackData.data.object.id
		const assetRes = await fetch(
			`https://api.mux.com/video/v1/assets/${assetId}`,
			{ headers: { Authorization: `Basic ${MUX_AUTH}` } },
		)

		if (!assetRes.ok) {
			const errorText = await assetRes.text()
			await log.error('api.video.downloads.mux_asset_error', {
				playbackId,
				assetId,
				status: assetRes.status,
				error: errorText,
			})
			return NextResponse.json(
				{ error: 'Failed to fetch asset from Mux API' },
				{ status: 500, headers: corsHeaders },
			)
		}

		const assetJson = await assetRes.json()
		const assetData = MuxAssetResponseSchema.parse(assetJson)

		// 4. Build download URLs from static renditions
		const staticFiles = assetData.data.static_renditions?.files ?? []
		const downloads = staticFiles
			.filter((f) => f.ext === 'mp4')
			.map((f) => ({
				quality: f.name.replace('.mp4', ''),
				url: `https://stream.mux.com/${playbackId}/${f.name}`,
				width: f.width,
				height: f.height,
				bitrate: f.bitrate,
				filesize: f.filesize ? parseInt(f.filesize, 10) : undefined,
			}))

		// 5. Return formatted response
		const response: VideoResponse = {
			playbackId,
			assetId,
			status: assetData.data.status,
			duration: assetData.data.duration,
			downloads,
		}

		await log.info('api.video.downloads.success', {
			playbackId,
			assetId,
			downloadCount: downloads.length,
		})

		return NextResponse.json(response, { headers: corsHeaders })
	} catch (error) {
		await log.error('api.video.downloads.failed', {
			playbackId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid response from Mux API' },
				{ status: 500, headers: corsHeaders },
			)
		}

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
