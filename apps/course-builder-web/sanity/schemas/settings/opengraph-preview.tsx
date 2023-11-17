import {Card} from '@sanity/ui'
import {height, OpenGraphImage, width} from '../../components/OpenGraphImage'
import {createIntlSegmenterPolyfill} from 'intl-segmenter-polyfill'
import type {Settings} from '../../lib/sanity.queries'
import satori, {type SatoriOptions} from 'satori'
import styled from 'styled-components'
import useSWR from 'swr/immutable'

async function init(): Promise<SatoriOptions['fonts']> {
  if (!globalThis?.Intl?.Segmenter) {
    console.debug('Polyfilling Intl.Segmenter')
    globalThis.Intl = globalThis.Intl || {}
    //@ts-expect-error
    globalThis.Intl.Segmenter = await createIntlSegmenterPolyfill(
      fetch(new URL('public/break_iterator.wasm', import.meta.url)),
    )
  }

  const fontData = await fetch(
    new URL('public/Inter-Bold.woff', import.meta.url),
  ).then((res) => res.arrayBuffer())

  return [{name: 'Inter', data: fontData, style: 'normal', weight: 700}]
}

// preload fonts and polyfill
const fontsPromise = init()

const OpenGraphSvg = styled(Card).attrs({
  radius: 3,
  shadow: 1,
  overflow: 'hidden',
})`
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    display: block;
    object-fit: cover;
    aspect-ratio: ${width} / ${height};
    object-position: center;
    height: 100%;
    width: 100%;
  }
`

export default function OpenGraphPreview(props: Settings['ogImage']) {
  // we wrap the segmenter setup and font loading in SWR to enable caching
  const {data: fonts} = useSWR('OpenGraphPreview.init', () => fontsPromise, {
    suspense: true,
  })

  // Also handle the satori render call in SWR to enable caching and only re-render when the title changes or fonts hot reload
  const {data: __html} = useSWR(
    [props?.title, fonts satisfies SatoriOptions['fonts']],
    ([title, fonts]) => {
      return satori(<OpenGraphImage title={title || ''} />, {
        width,
        height,
        fonts,
      })
    },
    {suspense: true},
  )

  return <OpenGraphSvg dangerouslySetInnerHTML={{__html}} />
}
