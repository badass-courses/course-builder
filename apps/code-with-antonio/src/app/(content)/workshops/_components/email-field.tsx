import * as React from 'react'
import Link from 'next/link'
import { api } from '@/trpc/react'
import { Pencil, Plus } from 'lucide-react'

import { Button, FormDescription, FormLabel, Skeleton } from '@coursebuilder/ui'

/**
 * A component for handling email selection and management for workshops.
 * Allows attaching/detaching emails from workshops and creating new emails.
 */
export interface EmailFieldProps {
	/**
	 * The workshop resource that has emails in its resources array
	 */
	workshop: {
		id: string
		resources?: {
			resourceId: string
			resourceOfId: string
			position: number
			createdAt: Date
			updatedAt: Date
			resource: {
				id: string
				type: string
				fields: {
					title: string
					slug: string
					state?: string
					visibility?: string
				}
			}
		}[]
	}
	label?: string
	showEditButton?: boolean
}

export const EmailField: React.FC<EmailFieldProps> = ({
	workshop,
	label = 'Related Emails',
	showEditButton = false,
}) => {
	const [newEmailTitle, setNewEmailTitle] = React.useState('')
	const utils = api.useUtils()
	const { data: emails, isLoading } = api.emails.getEmails.useQuery()

	const { mutate: addEmailToWorkshop, isPending: isAdding } =
		api.emails.addEmailToWorkshop.useMutation({
			onSuccess: () => {
				utils.emails.getEmails.invalidate()
				utils.invalidate()
			},
		})

	const { mutate: removeEmailFromWorkshop, isPending: isRemoving } =
		api.emails.removeEmailFromWorkshop.useMutation({
			onSuccess: () => {
				utils.emails.getEmails.invalidate()
				utils.invalidate()
			},
		})

	const { mutate: createEmail, isPending: isCreating } =
		api.emails.createEmail.useMutation({
			onSuccess: () => {
				utils.emails.getEmails.invalidate()
			},
		})

	// Filter attached emails from workshop.resources
	const attachedEmails =
		workshop.resources?.filter(
			(resource) => resource.resource?.type === 'email',
		) || []

	// Available emails that aren't already attached
	const availableEmails =
		emails?.filter(
			(email) =>
				!attachedEmails.some((attached) => attached.resourceId === email.id),
		) || []

	const handleCreateEmail = (title: string) => {
		createEmail({
			fields: {
				title,
			},
		})
	}

	const handleAttachEmail = (emailId: string) => {
		addEmailToWorkshop({
			workshopId: workshop.id,
			emailId,
		})
	}

	const handleDetachEmail = (emailId: string) => {
		removeEmailFromWorkshop({
			workshopId: workshop.id,
			emailId,
		})
	}

	return (
		<div className="px-5">
			<div className="flex w-full items-baseline justify-between">
				<FormLabel className="text-lg font-bold">{label}</FormLabel>
				{showEditButton && (
					<Button
						variant="ghost"
						size="sm"
						className="flex items-center gap-1 opacity-75 hover:opacity-100"
						asChild
					>
						<Link href="/admin/emails">
							<Pencil className="h-3 w-3" /> Edit
						</Link>
					</Button>
				)}
			</div>

			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-9 w-full" />
					<Skeleton className="h-9 w-32" />
				</div>
			) : (
				<div className="space-y-4">
					{/* Attached Emails */}
					{attachedEmails.length > 0 && (
						<div className="space-y-2">
							<h4 className="text-sm font-medium">Attached Emails</h4>
							<div className="flex flex-wrap gap-2">
								{attachedEmails.map((attached) => (
									<div
										key={attached.resourceId}
										className="bg-background flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
									>
										<span>{attached.resource.fields.title}</span>
										<Button
											variant="ghost"
											size="sm"
											className="text-muted-foreground hover:text-destructive h-auto p-1"
											disabled={isRemoving}
											onClick={() => handleDetachEmail(attached.resourceId)}
										>
											×
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Available Emails */}
					{availableEmails.length > 0 && (
						<div className="space-y-2">
							<h4 className="text-sm font-medium">Available Emails</h4>
							<div className="flex flex-wrap gap-2">
								{availableEmails.map((email) => (
									<Button
										key={email.id}
										variant="outline"
										size="sm"
										className="h-auto px-3 py-1 text-sm"
										disabled={isAdding}
										onClick={() => handleAttachEmail(email.id)}
									>
										+ {email.fields.title}
									</Button>
								))}
							</div>
						</div>
					)}

					{/* Create New Email */}
					<div className="space-y-2">
						<h4 className="text-sm font-medium">Create New Email</h4>
						<div className="flex gap-2">
							<input
								value={newEmailTitle}
								onChange={(e) => setNewEmailTitle(e.target.value)}
								placeholder="Email title..."
								disabled={isCreating}
								className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:outline-hidden flex-1 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							/>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								disabled={isCreating}
								onClick={() => {
									if (newEmailTitle.trim()) {
										handleCreateEmail(newEmailTitle.trim())
										setNewEmailTitle('')
									}
								}}
							>
								<Plus className="h-3 w-3" /> Create
							</Button>
						</div>
					</div>

					{emails?.length === 0 && (
						<FormDescription>
							No emails available. Create an email to get started.
						</FormDescription>
					)}
				</div>
			)}
		</div>
	)
}
