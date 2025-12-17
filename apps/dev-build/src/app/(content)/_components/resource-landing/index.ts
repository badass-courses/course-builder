/**
 * Resource Landing Page Shared Components
 *
 * Unified primitives for resource landing pages (events, workshops, cohorts, lists).
 * These components provide consistent UI patterns while allowing page-specific customization.
 */

export { ResourceSidebar, ResourceSidebarMobile } from './resource-sidebar'
export type { ResourceSidebarProps, MobileCtaConfig } from './resource-sidebar'

export { ResourceHeader } from './resource-header'
export type { ResourceHeaderProps, ResourceBadge } from './resource-header'

export { ResourceBody } from './resource-body'
export type { ResourceBodyProps } from './resource-body'

export { ResourceLayout } from './resource-layout'
export type { ResourceLayoutProps } from './resource-layout'

export { ResourceActions } from './resource-actions'
export type { ResourceActionsProps } from './resource-actions'

export { ResourceShareFooter } from './resource-share-footer'
export type { ResourceShareFooterProps } from './resource-share-footer'

export { ResourceVisibilityBanner } from './resource-visibility-banner'
export type { ResourceVisibilityBannerProps } from './resource-visibility-banner'

export { ResourceAdminActions } from './resource-admin-actions'
export type { ResourceAdminActionsProps } from './resource-admin-actions'

export {
	ResourceScheduleDetails,
	ResourceScheduleDetailsMobile,
} from './resource-schedule-details'
export type { ResourceScheduleDetailsProps } from './resource-schedule-details'

// Re-export pricing components
export * from './pricing'

// Re-export MDX component factories
export {
	createEventMdxComponents,
	createWorkshopMdxComponents,
	createCohortMdxComponents,
} from './mdx-components'
