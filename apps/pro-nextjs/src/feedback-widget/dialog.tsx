import * as React from 'react'
import { XIcon } from '@heroicons/react/solid'
import * as Dialog from '@radix-ui/react-dialog'

const isBrowser = () => typeof window !== 'undefined'

type DialogProps = {
	handleCloseDialog: () => void
	isOpen: boolean
	title: string
}

const DialogComp: React.FC<React.PropsWithChildren<DialogProps>> = ({
	handleCloseDialog,
	children,
	isOpen,
	title,
}) => {
	const closeButtonRef = React.useRef<HTMLButtonElement>(null)

	console.log('DialogComp', isOpen)

	return (
		<Dialog.Root open={isOpen}>
			<Dialog.Portal
				container={
					isBrowser()
						? (window.document.getElementById('layout') as HTMLElement)
						: undefined
				}
			>
				<Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur" />
				<Dialog.Content
					// onPointerDownOutside={handleCloseDialog}
					onEscapeKeyDown={handleCloseDialog}
					className="bg-card fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 shadow-2xl shadow-black/50"
				>
					<CloseButton
						ref={closeButtonRef}
						handleCloseDialog={handleCloseDialog}
					/>
					<Dialog.Title className="pb-4 text-2xl font-semibold">
						{title}
					</Dialog.Title>
					{children}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

type CloseButtonProps = {
	handleCloseDialog: () => void
}

const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
	({ handleCloseDialog }, ref) => {
		return (
			<div className="absolute right-2 top-2">
				<button
					ref={ref}
					type="button"
					className="inline-flex justify-center rounded-md border border-transparent p-2 text-sm font-medium transition hover:bg-gray-700 hover:shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
					onClick={handleCloseDialog}
				>
					<XIcon className="h-5 w-5" aria-hidden="true" />
					<span className="sr-only">Close feedback dialog</span>
				</button>
			</div>
		)
	},
)

export default DialogComp
