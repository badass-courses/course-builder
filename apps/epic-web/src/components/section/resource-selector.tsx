'use client'

import { useState } from 'react'
import { api } from '@/trpc/react'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button } from '@coursebuilder/ui/primitives/button'
import { Checkbox } from '@coursebuilder/ui/primitives/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui/primitives/dialog'
import { Input } from '@coursebuilder/ui/primitives/input'
import { Label } from '@coursebuilder/ui/primitives/label'

type Resource = {
	id: string
	title: string
	type: string
	description?: string | null
	createdAt: Date
}

type ResourceSelectorProps = {
	sectionId: string
	contentResourceId: string
	onResourceAdded?: () => void
}

export function ResourceSelector({
	sectionId,
	contentResourceId,
	onResourceAdded,
}: ResourceSelectorProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedResources, setSelectedResources] = useState<
		Record<string, boolean>
	>({})

	// This would be replaced with a real query to fetch resources
	// For now, using a placeholder
	const { data: resources, isLoading } =
		api.contentResources.getAvailableResources.useQuery(
			{ contentResourceId, search: searchTerm },
			{
				enabled: isDialogOpen,
				onError: (error) => {
					toast.error(`Error loading resources: ${error.message}`)
				},
			},
		)

	const addResourceMutation = api.section.addResourceToSection.useMutation({
		onSuccess: () => {
			onResourceAdded?.()
		},
		onError: (error) => {
			toast.error(`Error adding resource: ${error.message}`)
		},
	})

	const handleSelectResource = (resourceId: string, isChecked: boolean) => {
		setSelectedResources((prev) => ({ ...prev, [resourceId]: isChecked }))
	}

	const handleAddResources = async () => {
		const resourceIds = Object.keys(selectedResources).filter(
			(id) => selectedResources[id],
		)

		if (resourceIds.length === 0) {
			toast.error('Please select at least one resource')
			return
		}

		// Add resources one by one
		for (const resourceId of resourceIds) {
			try {
				await addResourceMutation.mutateAsync({
					sectionId,
					resourceId,
				})
			} catch (error) {
				// Errors are handled in the onError callback
			}
		}

		toast.success(`Added ${resourceIds.length} resource(s) to section`)
		setIsDialogOpen(false)
		setSelectedResources({})
		setSearchTerm('')
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<PlusIcon className="mr-2 h-4 w-4" />
					Add Resources
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add Resources to Section</DialogTitle>
					<DialogDescription>
						Select resources to add to this section.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<div className="relative mb-4">
						<SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
						<Input
							placeholder="Search resources..."
							className="pl-10"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					<div className="rounded-md border">
						{isLoading ? (
							<div className="flex justify-center py-8">
								<div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2 border-t-2"></div>
							</div>
						) : resources && resources.length > 0 ? (
							<div className="max-h-60 overflow-y-auto">
								{resources.map((resource) => (
									<div
										key={resource.id}
										className="flex items-start border-b p-3 last:border-b-0"
									>
										<Checkbox
											id={`resource-${resource.id}`}
											checked={!!selectedResources[resource.id]}
											onCheckedChange={(checked) =>
												handleSelectResource(resource.id, checked === true)
											}
											className="mr-3 mt-1"
										/>
										<div className="flex-grow">
											<Label
												htmlFor={`resource-${resource.id}`}
												className="cursor-pointer font-medium"
											>
												{resource.title}
											</Label>
											{resource.description && (
												<p className="text-muted-foreground mt-1 text-sm">
													{resource.description}
												</p>
											)}
											<div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
												<span className="capitalize">{resource.type}</span>
												<span>
													Added:{' '}
													{new Date(resource.createdAt).toLocaleDateString()}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-muted-foreground p-8 text-center">
								No resources found.
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="secondary"
						onClick={() => {
							setIsDialogOpen(false)
							setSelectedResources({})
							setSearchTerm('')
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleAddResources}
						disabled={
							Object.keys(selectedResources).filter(
								(id) => selectedResources[id],
							).length === 0
						}
					>
						Add Selected Resources
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
