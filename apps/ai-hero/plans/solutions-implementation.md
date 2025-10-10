# Solutions Implementation Plan

## Overview

Implement solution resources for workshop lessons using a pattern that matches our existing architecture. Solutions are structured similarly to lessons but with a different resource type and purpose.

## 1. Schema Definition

Create `src/lib/solution.ts` to define the Solution schema:

```typescript
import { z } from 'zod'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

export const SolutionSchema = ContentResourceSchema.merge(
  z.object({
    id: z.string(),
    type: z.literal('solution'),
    createdById: z.string(),
    createdAt: z.coerce.date().nullable(),
    updatedAt: z.coerce.date().nullable(),
    deletedAt: z.coerce.date().nullable(),
    fields: z.object({
      title: z.string().min(2).max(90),
      body: z.string().optional(),
      slug: z.string(),
      description: z.string().optional(),
      state: z
        .enum(['draft', 'published', 'archived', 'deleted'])
        .default('draft'),
      visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
    }),
    resources: z.array(z.any()).default([]).nullable(),
  }),
)

export type Solution = z.infer<typeof SolutionSchema>
```

## 2. Server Actions

Create `src/lib/solutions-query.ts` to implement server actions for solutions:

```typescript
'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { Solution, SolutionSchema } from '@/lib/solution'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, eq, like, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { log } from '@/server/logger'

/**
 * Get a solution for a specific lesson
 */
export async function getSolutionForLesson(lessonId: string) {
  const resourceJoin = await db.query.contentResourceResource.findFirst({
    where: and(
      eq(contentResourceResource.resourceOfId, lessonId),
      eq(contentResourceResource.deletedAt, null),
    ),
    with: {
      resource: {
        where: and(
          eq(contentResource.type, 'solution'),
          eq(contentResource.deletedAt, null)
        )
      },
    },
  })

  if (!resourceJoin?.resource) {
    return null
  }

  return SolutionSchema.parse(resourceJoin.resource)
}

/**
 * Get solution by ID or slug
 */
export async function getSolution(solutionSlugOrId: string) {
  const solution = await db.query.contentResource.findFirst({
    where: and(
      or(
        eq(
          sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
          solutionSlugOrId,
        ),
        eq(contentResource.id, solutionSlugOrId),
      ),
      eq(contentResource.type, 'solution'),
      eq(contentResource.deletedAt, null),
    ),
  })

  if (!solution) {
    return null
  }

  const parsedSolution = SolutionSchema.safeParse(solution)
  if (!parsedSolution.success) {
    console.error('Error parsing solution', solution, parsedSolution.error)
    return null
  }

  return parsedSolution.data
}

/**
 * Create a new solution for a lesson
 */
export async function createSolution({
  lessonId,
  title,
  body,
  slug,
  description,
}: {
  lessonId: string
  title: string
  body?: string
  slug: string
  description?: string
}) {
  const { session, ability } = await getServerAuthSession()
  const user = session?.user

  if (!user || !ability.can('create', 'Content')) {
    throw new Error('Unauthorized')
  }

  try {
    // Create the solution resource
    const solution = await courseBuilderAdapter.createContentResource({
      type: 'solution',
      fields: {
        title,
        body: body || '',
        slug,
        description: description || '',
        state: 'draft',
        visibility: 'unlisted',
      },
      createdById: user.id,
    })

    // Create the link between lesson and solution
    await db.insert(contentResourceResource).values({
      resourceId: solution.id,
      resourceOfId: lessonId,
      position: 0,
    })

    log.info('solution.created', {
      solutionId: solution.id,
      lessonId,
      userId: user.id,
    })

    revalidateTag('solution', 'max')
    return solution
  } catch (error) {
    log.error('solution.create.error', {
      error,
      lessonId,
      userId: user.id,
    })
    throw error
  }
}

/**
 * Update an existing solution
 */
export async function updateSolution(input: Partial<Solution>) {
  const { session, ability } = await getServerAuthSession()
  const user = session?.user
  
  if (!user || !ability.can('update', 'Content')) {
    throw new Error('Unauthorized')
  }

  // Ensure we have an ID to look up
  const id = input.id
  if (!id) {
    throw new Error('Solution ID is required for updates')
  }

  const currentSolution = await getSolution(id)

  if (!currentSolution) {
    throw new Error(`Solution with id ${id} not found.`)
  }

  let solutionSlug = currentSolution.fields.slug

  // Handle title changes for slug updates
  if (input.fields?.title && input.fields.title !== currentSolution.fields.title) {
    const splitSlug = currentSolution?.fields.slug.split('~') || ['', guid()]
    solutionSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
  }

  const updatedResource = courseBuilderAdapter.updateContentResourceFields({
    id: currentSolution.id,
    fields: {
      ...currentSolution.fields,
      ...input.fields,
      slug: solutionSlug,
    },
  })

  log.info('solution.updated', {
    solutionId: currentSolution.id,
    userId: user.id,
  })

  revalidateTag('solution', 'max')
  return updatedResource
}

/**
 * Delete a solution
 */
export async function deleteSolution(solutionId: string) {
  const { session, ability } = await getServerAuthSession()
  const user = session?.user
  
  if (!user || !ability.can('delete', 'Content')) {
    throw new Error('Unauthorized')
  }

  try {
    // Find the resource join first
    const resourceJoin = await db.query.contentResourceResource.findFirst({
      where: and(
        eq(contentResourceResource.resourceId, solutionId),
        eq(contentResourceResource.deletedAt, null),
      ),
    })

    if (!resourceJoin) {
      throw new Error('Solution not found or not linked to a lesson')
    }

    // Soft delete the solution
    await db
      .update(contentResource)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(contentResource.id, solutionId))

    // Soft delete the resource join
    await db
      .update(contentResourceResource)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(contentResourceResource.resourceId, solutionId))

    log.info('solution.deleted', {
      solutionId,
      lessonId: resourceJoin.resourceOfId,
      userId: user.id,
    })

    revalidateTag('solution', 'max')
    return { success: true }
  } catch (error) {
    log.error('solution.delete.error', {
      error,
      solutionId,
      userId: user.id,
    })
    throw error
  }
}
```

## 3. Create Solution Form Component

Create a solution form component using the `withResourceForm` HOC:

```typescript
// src/app/(content)/workshops/_components/edit-solution-form.tsx
import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Solution, SolutionSchema } from '@/lib/solution'
import { withResourceForm } from '@/components/resource-form/with-resource-form'
import { createSolution, updateSolution } from '@/lib/solutions-query'

import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@coursebuilder/ui'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

// Base Solution form component
const BaseSolutionForm = ({ resource: solution, form }) => {
  return (
    <>
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
              A clear title for this solution.
            </FormDescription>
            <Input {...field} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="fields.body"
        render={({ field }) => (
          <FormItem className="px-5">
            <FormLabel className="text-lg font-bold">Solution Content</FormLabel>
            <FormDescription>
              Add code examples, explanations, and implementation details.
            </FormDescription>
            <Textarea className="min-h-[300px] font-mono" {...field} />
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
              A brief explanation of the approach used in this solution.
            </FormDescription>
            <Textarea {...field} />
            <FormMessage />
          </FormItem>
        )}
      />
      <MetadataFieldVisibility form={form} />
      <MetadataFieldState form={form} />
    </>
  )
}

// Create the HOC-wrapped component
export function EditSolutionForm({ solution, lessonId }) {
  const router = useRouter()
  const { module, lesson } = useParams()
  
  const SolutionFormWithResource = withResourceForm(BaseSolutionForm, {
    resourceType: 'solution',
    schema: SolutionSchema,
    defaultValues: (solution) => ({
      id: solution?.id || '',
      type: 'solution',
      fields: {
        title: solution?.fields?.title || '',
        body: solution?.fields?.body || '',
        slug: solution?.fields?.slug || '',
        description: solution?.fields?.description || '',
        state: solution?.fields?.state || 'draft',
        visibility: solution?.fields?.visibility || 'unlisted',
      },
    }),
    getResourcePath: () => `/workshops/${module}/${lesson}`,
    updateResource: async (updatedSolution) => {
      if (!solution?.id) {
        // Create new solution
        return createSolution({
          lessonId,
          title: updatedSolution.fields.title,
          body: updatedSolution.fields.body,
          slug: updatedSolution.fields.slug,
          description: updatedSolution.fields.description,
        })
      } else {
        // Update existing solution
        return updateSolution(updatedSolution)
      }
    },
    onSave: async () => {
      router.push(`/workshops/${module}/${lesson}/edit`)
    },
  })

  return (
    <SolutionFormWithResource
      resource={
        solution || {
          id: '',
          type: 'solution',
          fields: {
            title: '',
            body: '',
            slug: '',
            description: '',
            state: 'draft',
            visibility: 'unlisted',
          },
          resources: [],
        }
      }
    />
  )
}
```

## 4. Add Solution Edit Page

Create the solution edit page:

```typescript
// src/app/(content)/workshops/[module]/[lesson]/solution/edit/page.tsx
import * as React from 'react'
import { notFound } from 'next/navigation'
import { getSolutionForLesson } from '@/lib/solutions-query'
import { getLesson } from '@/lib/lessons-query'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'

import { EditSolutionForm } from '../../../../_components/edit-solution-form'

export default async function SolutionEditPage(props: {
  params: { module: string, lesson: string }
}) {
  const { module, lesson } = props.params
  const { ability } = await getServerAuthSession()
  
  if (!ability.can('create', 'Content')) {
    notFound()
  }

  // Get the lesson first to ensure it exists
  const lessonData = await getLesson(lesson)
  if (!lessonData) {
    notFound()
  }

  // Get the solution for this lesson if it exists
  const solution = await getSolutionForLesson(lessonData.id)
  
  // If solution doesn't exist, prepare a default slug
  const defaultSlug = solution ? 
    solution.fields.slug : 
    `${lessonData.fields.slug}-solution~${guid()}`

  return (
    <EditSolutionForm
      key={solution?.id || `new-solution-${lessonData.id}`}
      solution={solution}
      lessonId={lessonData.id}
      defaultSlug={defaultSlug}
    />
  )
}
```

## 5. Add Solution View Page

Create a page to view solutions:

```typescript
// src/app/(content)/workshops/[module]/[lesson]/solution/page.tsx
import * as React from 'react'
import { notFound } from 'next/navigation'
import { getSolutionForLesson } from '@/lib/solutions-query'
import { getLesson } from '@/lib/lessons-query'
import { getServerAuthSession } from '@/server/auth'
import { Markdown } from '@/components/markdown'

export default async function SolutionViewPage(props: {
  params: { module: string, lesson: string }
}) {
  const { lesson: lessonSlug } = props.params
  const { ability } = await getServerAuthSession()
  
  // Get the lesson first
  const lesson = await getLesson(lessonSlug)
  if (!lesson) {
    notFound()
  }

  // Get the solution for this lesson
  const solution = await getSolutionForLesson(lesson.id)
  if (!solution) {
    notFound()
  }

  // Check if user can access the solution based on visibility
  if (solution.fields.visibility === 'private' && !ability.can('read', 'Content')) {
    notFound()
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">{solution.fields.title}</h1>
      
      {solution.fields.description && (
        <div className="mb-8 text-muted-foreground bg-muted p-4 rounded-md">
          <p className="italic">{solution.fields.description}</p>
        </div>
      )}
      
      <div className="prose dark:prose-invert max-w-none">
        <Markdown>{solution.fields.body || ''}</Markdown>
      </div>
    </div>
  )
}
```

## 6. Update Lesson Metadata Form

Update the lesson metadata form to link to the solution editor:

```typescript
// In src/app/(content)/workshops/_components/edit-workshop-lesson-form-metadata.tsx
// In the solution section:

{solutionResource ? (
  <div className="mt-4 space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="font-medium">{solutionResource.fields.title}</h3>
      <div className="space-x-2">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/workshops/${module}/${lesson.fields.slug}/solution/edit`)}
        >
          Edit Solution
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={async () => {
            if (confirm("Are you sure you want to delete this solution?")) {
              await deleteSolution(solutionResource.id);
              refetchSolution();
            }
          }}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
    {/* Display solution content preview */}
    <div className="bg-muted rounded-md p-4">
      <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
        {solutionResource.fields.body || "No solution content yet."}
      </ReactMarkdown>
    </div>
    {/* ... */}
  </div>
) : (
  <div className="mt-4">
    <Button
      onClick={() => router.push(`/workshops/${module}/${lesson.fields.slug}/solution/edit`)}
    >
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Solution
    </Button>
  </div>
)}
```

## 7. Update TRPC Router (Optional)

While we're focusing on server actions, we might still want to keep the TRPC endpoints for client-side operations:

1. Update the `getForLesson` endpoint to use the server action internally
2. Update the mutation endpoints to call our server actions

This gives us flexibility to use either approach depending on the context.

## 8. Testing Plan

1. Test solution creation from lesson editor
2. Test solution editing in dedicated form
3. Test solution deletion
4. Verify solution visibility controls work
5. Test navigation between lesson and solution pages

## Migration Approach

1. First implement the server actions and schema in parallel with TRPC router
2. Update the UI components to use server actions
3. Add solution edit/view pages
4. Once everything is working with server actions, consider deprecating TRPC endpoints if not needed 