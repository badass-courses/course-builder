import * as React from 'react'
import { use } from 'react'
import Image from 'next/image'
import { requestCodeExtraction } from '@/app/tips/_components/tip-form-actions'
import { useSocket } from '@/hooks/use-socket'
import ReactMarkdown from 'react-markdown'

import { Button, ResizablePanel, ScrollArea } from '@coursebuilder/ui'

export function EditResourcesTranscriptWithScreenshotsPanel({
  transcriptWithScreenshotsLoader,
  videoResourceId,
}: {
  transcriptWithScreenshotsLoader?: Promise<string | null>
  videoResourceId: string
}) {
  const initialTranscriptWithScreenshots = transcriptWithScreenshotsLoader ? use(transcriptWithScreenshotsLoader) : null

  const [transcriptWithScreenshots, setTranscriptWithScreenshots] = React.useState<string | null>(
    initialTranscriptWithScreenshots,
  )

  useSocket({
    room: videoResourceId,
    onMessage: async (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data)

        switch (data.name) {
          case 'transcriptWithScreenshots.ready':
            setTranscriptWithScreenshots(data.body)
            break
          default:
            break
        }
      } catch (error) {
        // nothing to do
      }
    },
  })

  return (
    <ResizablePanel
      defaultSize={20}
      minSize={1}
      maxSize={50}
      collapsible={true}
      collapsedSize={1}
      className="hidden h-[var(--pane-layout-height)] min-h-[var(--pane-layout-height)] md:flex md:min-h-full"
    >
      <ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
        <div className="p-5">
          <ReactMarkdown
            className="prose dark:prose-invert prose-sm"
            components={{
              img: (props) => {
                if (!props.src) return null

                return (
                  <>
                    <a href={props.src} target="_blank" rel="noreferrer">
                      <Image
                        src={props.src}
                        alt={'screenshot'}
                        width={1960}
                        height={1080}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', `![](${e.currentTarget.src})`)
                        }}
                      />
                    </a>
                    <Button
                      size="sm"
                      onClick={() => {
                        const screenshotUrl = new URL(props.src as string)
                        screenshotUrl.searchParams.set('width', '1920')
                        screenshotUrl.searchParams.set('height', '1080')
                        requestCodeExtraction({ imageUrl: screenshotUrl.toString(), resourceId: videoResourceId })
                      }}
                    >
                      Get Code Text
                    </Button>
                  </>
                )
              },
            }}
          >
            {transcriptWithScreenshots}
          </ReactMarkdown>
        </div>
      </ScrollArea>
    </ResizablePanel>
  )
}
