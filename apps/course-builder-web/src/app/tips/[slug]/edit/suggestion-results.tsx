'use client'

import * as React from 'react'
import {useSocket} from '@/hooks/use-socket'

export function SuggestionResults({
  videoResourceId,
}: {
  videoResourceId: string
}) {
  const [suggestions, setSuggestions] = React.useState<any[]>([])
  useSocket({
    onMessage: async (messageEvent) => {
      const data = JSON.parse(messageEvent.data)
      const invalidateOn = ['ai.tip.draft.completed']

      if (
        invalidateOn.includes(data.name) &&
        data.requestId === videoResourceId
      ) {
        setSuggestions((prev) => [...prev, data.body])
      }
    },
  })

  return (
    <div>
      {suggestions.map((suggestion) => {
        return <div key={suggestion.title}>{suggestion.title}</div>
      })}
    </div>
  )
}
