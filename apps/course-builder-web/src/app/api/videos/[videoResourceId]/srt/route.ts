import {type NextRequest} from 'next/server'
import {sanityQuery} from '@/server/sanity.server'

export const GET = async (
  _: NextRequest,
  {params}: {params: {videoResourceId: string}},
) => {
  const videoResource =
    await sanityQuery(`*[_type == "videoResource" && _id == "${params.videoResourceId}"][0]{
    srt
   }`)
  return new Response(videoResource.srt || '', {
    status: 200,
  })
}
