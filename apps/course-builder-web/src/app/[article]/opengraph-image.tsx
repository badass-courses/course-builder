import { ImageResponse } from 'next/og'
import { getArticle } from '@/lib/articles'

export const runtime = 'edge'
export const revalidate = 60

export default async function ArticleOG({ params }: { params: { article: string } }) {
  //   const authorPhoto = fetch(
  //     new URL(`../../public/images/author.jpg`, import.meta.url)
  //   ).then(res => res.arrayBuffer());

  // fonts
  const inter500 = fetch(
    new URL(`../../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff`, import.meta.url),
  ).then((res) => res.arrayBuffer())

  const resource = await getArticle(params.article)

  return new ImageResponse(
    (
      <div tw="flex p-10 h-full w-full bg-white flex-col" style={font('Inter 500')}>
        <main tw="flex flex-col gap-5 h-full flex-grow items-center justify-center">
          <div tw="absolute text-[32px] top-5">Course Builder</div>
          <div tw="text-[48px]">{resource?.title}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* <img
                tw="rounded-full h-74"
                alt={author.name}
                @ts-ignore
                src={await authorPhoto}
              /> */}
        </main>
        <Background />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter 500',
          data: await inter500,
        },
      ],
    },
  )
}

// lil helper for more succinct styles
function font(fontFamily: string) {
  return { fontFamily }
}

const Background = () => {
  return (
    <svg
      style={{ position: 'absolute', opacity: 0.05 }}
      width="1200"
      height="630"
      viewBox="0 0 1200 630"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_50_18106)">
        <line y1="125.5" x2="1200" y2="125.5" stroke="black" />
        <line y1="251.5" x2="1200" y2="251.5" stroke="black" />
        <line y1="377.5" x2="1200" y2="377.5" stroke="black" />
        <line y1="503.5" x2="1200" y2="503.5" stroke="black" />
        <line x1="150.5" y1="-2.18557e-08" x2="150.5" y2="630" stroke="black" />
        <line x1="300.5" y1="-2.18557e-08" x2="300.5" y2="630" stroke="black" />
        <line x1="450.5" y1="-2.18557e-08" x2="450.5" y2="630" stroke="black" />
        <line x1="600.5" y1="-2.18557e-08" x2="600.5" y2="630" stroke="black" />
        <line x1="750.5" y1="-2.18557e-08" x2="750.5" y2="630" stroke="black" />
        <line x1="900.5" y1="-2.18557e-08" x2="900.5" y2="630" stroke="black" />
        <line x1="1050.5" y1="-2.18557e-08" x2="1050.5" y2="630" stroke="black" />
      </g>
      <defs>
        <clipPath id="clip0_50_18106">
          <rect width="1200" height="630" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
