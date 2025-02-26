import * as React from 'react'

import { ContentResource } from '@coursebuilder/core/schemas'

/**
 * Context for providing the current resource being edited to child components
 * This allows tools and other components to access the resource without prop drilling
 */
export interface ResourceContextType {
	resource: ContentResource
	resourceType: string
}

export const ResourceContext = React.createContext<ResourceContextType | null>(
	null,
)

/**
 * Provider component for the ResourceContext
 */
export function ResourceProvider({
	children,
	resource,
	resourceType,
}: React.PropsWithChildren<{
	resource: ContentResource
	resourceType: string
}>) {
	return (
		<ResourceContext.Provider value={{ resource, resourceType }}>
			{children}
		</ResourceContext.Provider>
	)
}

/**
 * Hook to use the resource context
 * @returns The current resource context
 * @throws Error if used outside of a ResourceProvider
 */
export function useResource<
	T extends ContentResource = ContentResource,
>(): ResourceContextType & { resource: T } {
	const context = React.useContext(ResourceContext)
	if (!context) {
		throw new Error('useResource must be used within a ResourceProvider')
	}
	return context as ResourceContextType & { resource: T }
}
