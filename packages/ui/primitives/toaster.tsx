'use client'

import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from './toast'
import { useToast } from './use-toast'

export function Toaster({
	className,
	viewportClassName,
}: {
	className?: string
	viewportClassName?: string
}) {
	const { toasts } = useToast()

	return (
		<ToastProvider>
			{toasts.map(function ({ id, title, description, action, ...props }) {
				return (
					<Toast key={id} className={className} {...props}>
						<div className="grid gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>{description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose />
					</Toast>
				)
			})}
			<ToastViewport className={viewportClassName} />
		</ToastProvider>
	)
}
