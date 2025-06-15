import * as React from 'react'
import Link from 'next/link'
import { reprocessTranscript } from '@/app/(content)/posts/[slug]/edit/actions'
import Spinner from '@/components/spinner'
import { getVideoResource } from '@/lib/video-resource-query'
import { Edit, RefreshCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'

type TranscriptDialogProps = {
	transcript?: string | null
	isProcessing: boolean
	onReprocess: () => Promise<void>
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	videoResourceId?: string | null
}

const TranscriptDialog: React.FC<TranscriptDialogProps> = ({
	transcript,
	isProcessing,
	onReprocess,
	isOpen,
	onOpenChange,
	videoResourceId,
}) => {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline" size={'sm'} type="button">
					View Transcript
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-h-[80vh]">
				<DialogHeader className="flex items-baseline justify-between">
					<DialogTitle>Transcript</DialogTitle>
				</DialogHeader>
				<div className="max-h-[60vh] overflow-auto">
					{isProcessing ? (
						<div className="flex flex-col items-center justify-center gap-2 py-8">
							<Spinner className="h-4 w-4" />
							<span className="text-sm">Processing transcript...</span>
						</div>
					) : (
						<ReactMarkdown className="prose prose-sm dark:prose-invert relative mt-3 max-w-none overflow-hidden pr-3">
							{transcript}
						</ReactMarkdown>
					)}
				</div>
				<DialogFooter className="flex items-center">
					{videoResourceId && (
						<Button asChild variant="outline" className="gap-2">
							<Link href={`/videos/${videoResourceId}`}>
								<Edit className="w-3" /> Edit Transcript
							</Link>
						</Button>
					)}
					<Button
						variant="secondary"
						type="button"
						className="gap-2 [&_svg]:opacity-40"
						onClick={onReprocess}
						title="Reprocess"
					>
						<RefreshCcw className="w-3" /> Reprocess Transcript
					</Button>
					<Button type="button" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export function useTranscript(options: {
	videoResourceId: string | null | undefined
	initialTranscript?: string | null
}) {
	const [transcript, setTranscript] = React.useState<string | null>(
		options.initialTranscript || null,
	)
	const [isProcessing, setIsProcessing] = React.useState(false)
	const [isOpen, setIsOpen] = React.useState(false)

	// Update transcript when initialTranscript changes
	React.useEffect(() => {
		if (options.initialTranscript) {
			setTranscript(options.initialTranscript)
			setIsProcessing(false)
		}
	}, [options.initialTranscript])

	React.useEffect(() => {
		let isSubscribed = true

		async function run() {
			try {
				if (options.videoResourceId) {
					const { value: transcript } = await pollVideoResourceTranscript(
						options.videoResourceId,
					).next()
					if (transcript && isSubscribed) {
						setTranscript(transcript)
					}
				}
			} catch (error) {
				console.error('Error polling video resource transcript:', error)
			}
		}

		if (!options.initialTranscript && transcript === null) {
			run()
		}

		return () => {
			isSubscribed = false
		}
	}, [options.initialTranscript, options.videoResourceId, transcript])

	const handleReprocess = async () => {
		if (!options.videoResourceId) return

		setIsProcessing(true)
		setTranscript(null)
		await reprocessTranscript({
			videoResourceId: options.videoResourceId,
		})
	}

	const TranscriptDialogComponent =
		options.initialTranscript || transcript ? (
			<TranscriptDialog
				transcript={transcript || options.initialTranscript}
				isProcessing={isProcessing}
				onReprocess={handleReprocess}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				videoResourceId={options.videoResourceId}
			/>
		) : null

	return {
		transcript: transcript || options.initialTranscript,
		setTranscript,
		isProcessing,
		setIsProcessing,
		TranscriptDialog: TranscriptDialogComponent,
	} as const
}

async function* pollVideoResourceTranscript(
	videoResourceId: string,
	maxAttempts = 30,
	initialDelay = 250,
	delayIncrement = 1000,
) {
	let delay = initialDelay

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const videoResource = await getVideoResource(videoResourceId)
		if (videoResource?.transcript) {
			yield videoResource.transcript
			return
		}

		await new Promise((resolve) => setTimeout(resolve, delay))
		delay += delayIncrement
	}

	throw new Error('Video resource not found after maximum attempts')
}
