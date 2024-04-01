import usePartySocket from 'partysocket/react'

export function useSocket(options: {
	onOpen?: (event: WebSocketEventMap['open']) => void
	onMessage?: (event: WebSocketEventMap['message']) => void
	onClose?: (event: WebSocketEventMap['close']) => void
	onError?: (event: WebSocketEventMap['error']) => void
	room?: string
	host: string
}) {
	return usePartySocket({
		...options,
		room: options.room || 'default',
	})
}
