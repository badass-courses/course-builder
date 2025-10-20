'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createWorkshopWithLessons } from '@/lib/workshops-query'
import { getUniqueFilename } from '@/utils/get-unique-filename'
import { UploadDropzone } from '@/utils/uploadthing'
import { YoutubeIcon } from 'lucide-react'

import {
	Button,
	CreateWorkshopForm,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'
import type { ButtonProps } from '@coursebuilder/ui/primitives/button'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

/**
 * Dialog component for creating workshops with lessons and sections
 *
 * @example
 * ```tsx
 * <CreateNewWorkshopDialog
 *   buttonLabel="Create Workshop"
 *   variant="default"
 * />
 * ```
 */
export default function CreateNewWorkshopDialog({
	buttonLabel = 'Create new workshop',
	variant = 'default',
	isOpen = false,
	className,
	modal = false,
}: {
	buttonLabel?: string | React.ReactNode
	className?: string
	variant?: ButtonProps['variant']
	isOpen?: boolean
	modal?: boolean
}) {
	const [open, setOpen] = React.useState(isOpen)
	const router = useRouter()

	const handleSuccess = async (result: {
		workshop: any
		sections?: any[]
		lessons?: any[]
		product?: any
	}) => {
		if (result.workshop?.fields?.slug) {
			router.push(
				getResourcePath('workshop', result.workshop.fields.slug, 'edit'),
			)
		}
	}

	return (
		<div>
			<Dialog
				modal={modal}
				onOpenChange={(isOpen) => {
					setOpen(isOpen)
				}}
				open={open}
			>
				<DialogTrigger asChild>
					<Button className={cn(className)} variant={variant}>
						{buttonLabel}
					</Button>
				</DialogTrigger>
				<DialogContent className="max-h-[90vh] overflow-y-auto">
					<DialogHeader className="border-b pb-4">
						<DialogTitle className="text-xl font-semibold">
							Create Workshop
						</DialogTitle>
						<DialogDescription>
							Create a workshop with sections and lessons. Upload videos for
							each lesson and set pricing and coupons.
						</DialogDescription>
					</DialogHeader>
					<CreateWorkshopForm
						createWorkshop={createWorkshopWithLessons}
						onSuccess={handleSuccess}
						defaultTimezone="America/Los_Angeles"
						defaultPrice={0}
						defaultQuantity={-1}
					>
						{(props) => (
							<UploadDropzone
								className="aspect-video rounded-md"
								input={{ parentResourceId: props.parentResourceId }}
								endpoint="videoUploader"
								config={{
									mode: 'auto',
								}}
								content={{
									label: 'Upload Video',
									uploadIcon: (
										<div className="bg-muted aspect-square rounded-full p-2">
											<YoutubeIcon
												strokeWidth={1}
												className="dark:text-muted-foreground text-foreground h-8 w-8"
											/>
										</div>
									),
								}}
								appearance={{
									container() {
										return {
											cursor: 'pointer',
											borderRadius: 'var(--radius)',
											background: 'var(--muted)',
											border: '1px dashed var(--border)',
											padding: '0.5rem 1rem',
										}
									},
									label({}) {
										return {
											color: 'var(--foreground)',
											fontWeight: 'normal',
										}
									},
									button() {
										return {
											background: 'var(--background)',
											color: 'var(--foreground)',
											border: '1px solid var(--border)',
											padding: '0.5rem 1rem',
											fontSize: '0.875rem',
										}
									},
								}}
								onBeforeUploadBegin={(files) => {
									return files.map(
										(file) =>
											new File([file], getUniqueFilename(file.name), {
												type: file.type,
											}),
									)
								}}
								onClientUploadComplete={async (response: any) => {
									if (response[0]?.name) {
										props.onUploadComplete(response[0].name)
									}
								}}
								onUploadError={(error: Error) => {
									console.error(`Upload error: ${error.message}`)
								}}
							/>
						)}
					</CreateWorkshopForm>
				</DialogContent>
			</Dialog>
		</div>
	)
}
