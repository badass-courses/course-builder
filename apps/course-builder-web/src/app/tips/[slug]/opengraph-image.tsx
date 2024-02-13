import { ImageResponse } from 'next/og'
import { getTip } from '@/lib/tips'

export const runtime = 'edge'
export const revalidate = 60

export default async function TipOG({ params }: { params: { slug: string } }) {
  const inter600 = fetch(
    new URL(`../../../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff`, import.meta.url),
  ).then((res) => res.arrayBuffer())

  const resource = await getTip(params.slug)

  return new ImageResponse(
    (
      <div
        tw="flex p-10 h-full w-full bg-white flex-col"
        style={{
          ...font('Inter 600'),
          backgroundImage:
            'url(https://res.cloudinary.com/badass-courses/image/upload/v1700690096/course-builder-og-image-template_qfarun.png)',
        }}
      >
        <main tw="flex flex-col gap-5 h-full flex-grow items-start pb-24 justify-center px-16">
          <div tw="text-[60px] text-white">{resource?.title}</div>
        </main>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter 600',
          data: await inter600,
        },
      ],
    },
  )
}

// lil helper for more succinct styles
function font(fontFamily: string) {
  return { fontFamily }
}
