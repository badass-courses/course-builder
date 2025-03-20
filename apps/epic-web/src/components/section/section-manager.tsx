'use client'

import { useCallback, useState } from 'react'
import { api } from '@/trpc/react'
import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from '@hello-pangea/dnd'
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button } from '@coursebuilder/ui/primitives/button'
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
import { Textarea } from '@coursebuilder/ui/primitives/textarea'

type Section = {
	id: string
	title: string
	description: string | null
	position: number
}

type SectionManagerProps = {
	contentResourceId: string
	onSectionChange?: () => void
}

export function SectionManager({
	contentResourceId,
	onSectionChange,
}: SectionManagerProps) {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [editingSection, setEditingSection] = useState<Section | null>(null)
	const [newSectionTitle, setNewSectionTitle] = useState('')
	const [newSectionDescription, setNewSectionDescription] = useState('')

	const {
		data: sections,
		isLoading,
		refetch,
	} = api.section.getSections.useQuery(
		{ contentResourceId },
		{ enabled: !!contentResourceId },
	)

	const createSectionMutation = api.section.createSection.useMutation({
		onSuccess: () => {
			toast.success('Section created')
			refetch()
			onSectionChange?.()
			setIsCreateDialogOpen(false)
			setNewSectionTitle('')
			setNewSectionDescription('')
		},
		onError: (error) => {
			toast.error(`Error creating section: ${error.message}`)
		},
	})

	const updateSectionMutation = api.section.updateSection.useMutation({
		onSuccess: () => {
			toast.success('Section updated')
			refetch()
			onSectionChange?.()
			setIsEditDialogOpen(false)
			setEditingSection(null)
		},
		onError: (error) => {
			toast.error(`Error updating section: ${error.message}`)
		},
	})

	const deleteSectionMutation = api.section.deleteSection.useMutation({
		onSuccess: () => {
			toast.success('Section deleted')
			refetch()
			onSectionChange?.()
		},
		onError: (error) => {
			toast.error(`Error deleting section: ${error.message}`)
		},
	})

	const reorderSectionsMutation = api.section.reorderSections.useMutation({
		onSuccess: () => {
			refetch()
			onSectionChange?.()
		},
		onError: (error) => {
			toast.error(`Error reordering sections: ${error.message}`)
			refetch() // Revert to original order
		},
	})

	const handleCreateSection = () => {
		if (!newSectionTitle.trim()) {
			toast.error('Section title is required')
			return
		}

		createSectionMutation.mutate({
			contentResourceId,
			title: newSectionTitle,
			description: newSectionDescription || undefined,
		})
	}

	const handleUpdateSection = () => {
		if (!editingSection) return

		if (!editingSection.title.trim()) {
			toast.error('Section title is required')
			return
		}

		updateSectionMutation.mutate({
			id: editingSection.id,
			title: editingSection.title,
			description: editingSection.description || undefined,
		})
	}

	const handleDeleteSection = (sectionId: string) => {
		if (
			confirm(
				"Are you sure you want to delete this section? This will remove all resources from this section, but won't delete the resources themselves.",
			)
		) {
			deleteSectionMutation.mutate({ id: sectionId })
		}
	}

	const handleEditSection = (section: Section) => {
		setEditingSection(section)
		setIsEditDialogOpen(true)
	}

	const handleDragEnd = useCallback(
		(result: DropResult) => {
			const { destination, source } = result

			// Dropped outside the list or no change
			if (
				!destination ||
				(destination.droppableId === source.droppableId &&
					destination.index === source.index)
			) {
				return
			}

			if (!sections) return

			const reorderedSections = Array.from(sections)
			const [movedSection] = reorderedSections.splice(source.index, 1)
			reorderedSections.splice(destination.index, 0, movedSection)

			// Only send if the order actually changed
			const sectionIds = reorderedSections.map((section) => section.id)
			reorderSectionsMutation.mutate({
				contentResourceId,
				sectionIds,
			})
		},
		[sections, contentResourceId, reorderSectionsMutation],
	)

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">Sections</h2>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm">
							<PlusIcon className="mr-2 h-4 w-4" />
							Add Section
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Section</DialogTitle>
							<DialogDescription>
								Add a new section to organize your content.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="section-title">Section Title</Label>
								<Input
									id="section-title"
									placeholder="e.g., Introduction, Advanced Topics"
									value={newSectionTitle}
									onChange={(e) => setNewSectionTitle(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="section-description">
									Description (optional)
								</Label>
								<Textarea
									id="section-description"
									placeholder="Brief description of this section"
									value={newSectionDescription}
									onChange={(e) => setNewSectionDescription(e.target.value)}
									rows={3}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="secondary"
								onClick={() => setIsCreateDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreateSection}
								disabled={
									createSectionMutation.isLoading || !newSectionTitle.trim()
								}
							>
								{createSectionMutation.isLoading
									? 'Creating...'
									: 'Create Section'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Section</DialogTitle>
							<DialogDescription>Update section details.</DialogDescription>
						</DialogHeader>
						{editingSection && (
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="edit-section-title">Section Title</Label>
									<Input
										id="edit-section-title"
										placeholder="e.g., Introduction, Advanced Topics"
										value={editingSection.title}
										onChange={(e) =>
											setEditingSection({
												...editingSection,
												title: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-section-description">
										Description (optional)
									</Label>
									<Textarea
										id="edit-section-description"
										placeholder="Brief description of this section"
										value={editingSection.description || ''}
										onChange={(e) =>
											setEditingSection({
												...editingSection,
												description: e.target.value,
											})
										}
										rows={3}
									/>
								</div>
							</div>
						)}
						<DialogFooter>
							<Button
								variant="secondary"
								onClick={() => setIsEditDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleUpdateSection}
								disabled={
									updateSectionMutation.isLoading ||
									!editingSection?.title.trim()
								}
							>
								{updateSectionMutation.isLoading ? 'Saving...' : 'Save Changes'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-8">
					<div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2 border-t-2"></div>
				</div>
			) : sections && sections.length > 0 ? (
				<DragDropContext onDragEnd={handleDragEnd}>
					<Droppable droppableId="sections-list">
						{(provided) => (
							<ul
								{...provided.droppableProps}
								ref={provided.innerRef}
								className="space-y-2"
							>
								{sections.map((section, index) => (
									<Draggable
										key={section.id}
										draggableId={section.id}
										index={index}
									>
										{(provided) => (
											<li
												ref={provided.innerRef}
												{...provided.draggableProps}
												{...provided.dragHandleProps}
												className="bg-card group flex items-center justify-between rounded-md border p-4"
											>
												<div>
													<h3 className="font-medium">{section.title}</h3>
													{section.description && (
														<p className="text-muted-foreground mt-1 text-sm">
															{section.description}
														</p>
													)}
												</div>
												<div className="flex space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleEditSection(section)}
													>
														<PencilIcon className="h-4 w-4" />
														<span className="sr-only">Edit</span>
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleDeleteSection(section.id)}
													>
														<TrashIcon className="text-destructive h-4 w-4" />
														<span className="sr-only">Delete</span>
													</Button>
												</div>
											</li>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</ul>
						)}
					</Droppable>
				</DragDropContext>
			) : (
				<div className="rounded-md border p-8 text-center">
					<p className="text-muted-foreground">
						No sections found. Create a section to organize your content.
					</p>
				</div>
			)}
		</div>
	)
}
