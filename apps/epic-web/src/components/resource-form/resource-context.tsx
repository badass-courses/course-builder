import * as React from 'react'
import { ResourceType } from '@/lib/resources'
import { UseFormReturn } from 'react-hook-form'
import { z, type Schema } from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'

/**
 * Context for providing the current resource being edited to child components
 * This allows tools and other components to access the resource without prop drilling
 */
export interface ResourceContextType<
	T extends ContentResource = ContentResource,
> {
	resource: T
	resourceType: ResourceType
	form: UseFormReturn<z.infer<Schema>>
}

// Create context with null as default value and generic type parameter
export const ResourceContext =
	React.createContext<ResourceContextType<any> | null>(null)

/**
 * Provider component for the ResourceContext
 *
 * @template T The specific ContentResource type being provided
 */
export function ResourceProvider<T extends ContentResource>({
	children,
	resource,
	resourceType,
	form,
}: React.PropsWithChildren<{
	resource: T
	resourceType: ResourceType
	form: UseFormReturn<z.infer<Schema>>
}>) {
	return (
		<ResourceContext.Provider value={{ resource, resourceType, form }}>
			{children}
		</ResourceContext.Provider>
	)
}

/**
 * Hook to use the resource context
 *
 * @template T The specific ContentResource type to cast the resource to
 * @returns The current resource context
 * @throws Error if used outside of a ResourceProvider
 */
export function useResource<
	T extends ContentResource = ContentResource,
>(): ResourceContextType<T> {
	const context = React.useContext(ResourceContext)
	// if (!context) {
	// 	throw new Error('useResource must be used within a ResourceProvider')
	// }
	return context as ResourceContextType<T>
}
