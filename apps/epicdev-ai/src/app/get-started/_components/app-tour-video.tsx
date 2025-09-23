'use client'
import MuxPlayer from '@mux/mux-player-react'

const AppTourVideo = ({
	playbackId = 'xSI7201jJf6lumgc9Kxwd5C65Rg8kLa94CcYzifZaL4U',
}: {
	playbackId?: string
}) => {
	return (
		<MuxPlayer
			playbackId={playbackId}
			accentColor="#3b82f6"
			className="w-full rounded"
			metadata={{
				video_title: 'AppTourVideo',
			}}
		/>
	)
}
export default AppTourVideo
