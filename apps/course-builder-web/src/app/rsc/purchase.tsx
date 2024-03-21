'use client'

import { useState } from 'react'
import { AI } from '@/app/rsc/action'
import { useActions, useAIState, useUIState } from 'ai/rsc'

export function Purchase({
  defaultAmount,
  name,
  price,
}: {
  defaultAmount?: number
  name: string
  price: number
}) {
  const [value, setValue] = useState(defaultAmount || 100)
  const [purchasingUI, setPurchasingUI] = useState<null | React.ReactNode>(null)
  const [history, setHistory] = useAIState<typeof AI>()
  const [, setMessages] = useUIState<typeof AI>()
  const { confirmPurchase } = useActions()

  return (
    <button
      className="mt-6 w-full rounded-lg bg-green-500 px-4 py-2 text-zinc-900 dark:bg-green-500"
      onClick={async () => {
        const response = await confirmPurchase(name, price, value)
        setPurchasingUI(response.purchasingUI)

        // Insert a new system message to the UI.
        setMessages((currentMessages: any) => [
          ...currentMessages,
          response.newMessage,
        ])
      }}
    >
      Buy {value} of {name} for ${price}
    </button>
  )
}
