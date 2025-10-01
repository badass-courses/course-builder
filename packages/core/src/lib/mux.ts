import { z } from 'zod'

import { MuxAssetSchema } from '../schemas/mux'

export const muxRequestHeaders = {
	Authorization: `Basic ${Buffer.from(`${process.env.MUX_ACCESS_TOKEN_ID}:${process.env.MUX_SECRET_KEY}`).toString('base64')}`,
	'Content-Type': 'application/json',
}

type MuxApiOptions = {
	passthrough?: string
	test?: boolean
	url?: string
	transcription?: boolean
}

export async function addSrtTrackToMuxAsset({
	assetId,
	srtUrl,
}: {
	assetId?: string
	srtUrl: string
}) {
	const muxAsset = await getMuxAsset(assetId)
	if (!muxAsset) {
		throw new Error('Mux Asset not found')
	}
	return await fetch(
		`https://api.mux.com/video/v1/assets/${muxAsset.id}/tracks`,
		{
			method: 'POST',
			headers: muxRequestHeaders,
			body: JSON.stringify({
				url: srtUrl,
				type: 'text',
				text_type: 'subtitles',
				closed_captions: true,
				language_code: 'en-US',
				name: 'English',
				passthrough: 'English',
			}),
		},
	)
		.then(async (response) => await response.json())
		.catch((error) => {
			console.error(error)
		})
}

export async function deleteSrtTrackFromMuxAsset(assetId?: string) {
	const muxAsset = await getMuxAsset(assetId)
	if (!muxAsset) {
		throw new Error('Mux Asset not found')
	}
	if (!muxAsset.tracks) return console.warn('No tracks found')

	const trackId = muxAsset.tracks.filter(
		(track: { type: string }) => track.type === 'text',
	)[0]?.id
	return await fetch(
		`https://api.mux.com/video/v1/assets/${muxAsset.id}/tracks/${trackId}`,
		{
			method: 'DELETE',
			headers: muxRequestHeaders,
		},
	).catch((error) => {
		console.error(error)
	})
}

export async function getMuxAsset(assetId?: string | null) {
	if (!assetId) {
		return null
	}
	const { data } = await fetch(
		`https://api.mux.com/video/v1/assets/${assetId}`,
		{
			headers: muxRequestHeaders,
		},
	).then(async (response) => await response.json())

	const parsedData = MuxAssetSchema.safeParse(data)

	return parsedData.success ? parsedData.data : null
}

export async function createMuxAsset(
	options?: MuxApiOptions,
): Promise<z.infer<typeof MuxAssetSchema>> {
	const baseUrl = 'https://api.mux.com'

	const muxOptions = getMuxOptions(options)

	const res = await fetch(`${baseUrl}/video/v1/assets`, {
		headers: muxRequestHeaders,
		method: 'POST',
		body: JSON.stringify(muxOptions.new_asset_settings),
	})
	const { data } = await res.json()
	return MuxAssetSchema.parse(data)
}

export function getMuxOptions(options?: MuxApiOptions) {
	return {
		cors_origin: '*',
		test: options?.test || false,
		new_asset_settings: {
			master_access: 'temporary',
			video_quality: 'plus',
			max_resolution_tier: '2160p',
			playback_policy: ['public'],
			input: [{ url: options?.url }],
			mp4_support: 'standard',
			...(options?.passthrough ? { passthrough: options.passthrough } : {}),
		},
	}
}
