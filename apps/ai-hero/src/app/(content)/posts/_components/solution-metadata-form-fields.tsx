import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { Post } from '@/lib/posts'
import type { Solution, UpdateSolutionInput } from '@/lib/solutions/solution'
import { ExternalLink } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import {
	Button,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

/**
 * Metadata form fields for solution posts.
 * This variant includes a parent lesson reference and solution-specific fields.
 */
export const SolutionMetadataFormFields: React.FC<{
	form: UseFormReturn<UpdateSolutionInput>
	post: Solution
	parentLesson: Post
	onNavigateToLesson?: () => void
}> = ({ form, post, parentLesson, onNavigateToLesson }) => {
	const router = useRouter()

	return (
		<>
			{/* Parent Lesson Section */}
			<div className="border-muted bg-muted/50 mb-6 rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-bold">Parent Lesson</h3>
						<p className="text-muted-foreground text-sm">
							This solution is attached to:
						</p>
					</div>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={onNavigateToLesson}
									className="h-8 w-8"
								>
									<ExternalLink className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left">
								<p className="text-xs">Go to parent lesson</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<div className="mt-2 font-medium">{parentLesson.fields.title}</div>
			</div>

			{/* Solution Fields */}
			<FormField
				control={form.control}
				name="id"
				render={({ field }) => <Input type="hidden" {...field} />}
			/>
			<FormField
				control={form.control}
				name="fields.title"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Title</FormLabel>
						<FormDescription>
							A clear title that describes what this solution demonstrates.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.slug"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Slug</FormLabel>
						<FormDescription>
							URL-friendly version of the title. Auto-generated but can be
							customized.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Description</FormLabel>
						<FormDescription>
							A brief description of what this solution covers.
						</FormDescription>
						<Input {...field} value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.github"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">GitHub URL</FormLabel>
						<FormDescription>
							Optional link to related GitHub repository or code.
						</FormDescription>
						<Input {...field} value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
			/>

			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
		</>
	)
}
