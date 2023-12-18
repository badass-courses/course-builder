import {env} from '@/env.mjs'
import {z} from 'zod'

export const muxRequestHeaders = {
  Authorization: `Basic ${Buffer.from(
    `${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`,
  ).toString('base64')}`,
  'Content-Type': 'application/json',
}

type MuxApiOptions = {
  passthrough?: string
  test?: boolean
  url?: string
  transcription?: boolean
}

const MuxAssetSchema = z.object({
  id: z.string(),
  playback_ids: z.array(
    z.object({
      id: z.string(),
      policy: z.string(),
    }),
  ),
})

export async function createMuxAsset(options?: MuxApiOptions) {
  const baseUrl = 'https://api.mux.com'

  const muxOptions = getMuxOptions(options)

  const res = await fetch(`${baseUrl}/video/v1/assets`, {
    headers: muxRequestHeaders,
    method: 'POST',
    body: JSON.stringify(muxOptions.new_asset_settings),
  })
  const {data} = await res.json()
  return MuxAssetSchema.parse(data)
}

export function getMuxOptions(options?: MuxApiOptions) {
  return {
    cors_origin: '*',
    test: options?.test || false,
    new_asset_settings: {
      master_access: 'temporary',
      max_resolution_tier: '2160p',
      playback_policy: ['public'],
      input: [{url: options?.url}],
      mp4_support: 'standard',
      ...(options?.passthrough ? {passthrough: options.passthrough} : {}),
    },
  }
}
