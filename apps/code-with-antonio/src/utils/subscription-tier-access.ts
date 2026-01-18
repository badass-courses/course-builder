/**
 * Subscription Tier Access Utilities
 *
 * Helper functions to check if a user's subscription tier grants access to specific resources.
 * Use these at the application layer for fine-grained tier-based access control.
 *
 * Tier Hierarchy:
 * - 'pro': Access to all content ('pro', 'standard', 'free')
 * - 'standard': Access to 'standard' and 'free' content only
 * - No subscription: Access to 'free' content only (if any)
 */

export type SubscriptionTier = 'pro' | 'standard' | null
export type ResourceTier = 'pro' | 'standard' | 'free' | undefined | null

/**
 * Check if a subscription tier can access a resource tier
 * @param subscriptionTier - The user's subscription tier ('pro', 'standard', or null)
 * @param resourceTier - The resource's tier ('pro', 'standard', 'free', or undefined)
 * @returns true if the subscription grants access to the resource
 */
export function canAccessResourceTier(
	subscriptionTier: SubscriptionTier,
	resourceTier: ResourceTier,
): boolean {
	// Free/undefined resources are accessible to everyone
	if (!resourceTier || resourceTier === 'free') {
		return true
	}

	// No subscription cannot access paid tiers
	if (!subscriptionTier) {
		return false
	}

	// Pro subscription can access everything
	if (subscriptionTier === 'pro') {
		return true
	}

	// Standard subscription can only access standard and free
	if (subscriptionTier === 'standard') {
		return resourceTier === 'standard'
	}

	return false
}

/**
 * Get the user's active subscription tier from their entitlements
 * @param entitlements - User entitlements array
 * @param subscriptionEntitlementTypeId - The ID of the 'subscription_access' entitlement type
 * @returns The subscription tier or null if no active subscription
 */
export function getActiveSubscriptionTier(
	entitlements:
		| Array<{
				type: string
				expires?: Date | null
				metadata?: Record<string, any>
		  }>
		| undefined,
	subscriptionEntitlementTypeId: string,
): SubscriptionTier {
	if (!entitlements) return null

	const activeSubscription = entitlements.find(
		(entitlement) =>
			entitlement.type === subscriptionEntitlementTypeId &&
			(!entitlement.expires || entitlement.expires > new Date()),
	)

	if (!activeSubscription) return null

	const tier = activeSubscription.metadata?.tier
	if (tier === 'pro' || tier === 'standard') {
		return tier
	}

	// Default to 'standard' for subscriptions without explicit tier
	return 'standard'
}

/**
 * Filter resources based on subscription tier
 * @param resources - Array of resources with optional tier metadata
 * @param subscriptionTier - The user's subscription tier
 * @returns Filtered array of resources the user can access
 */
export function filterResourcesByTier<
	T extends { metadata?: { tier?: ResourceTier } },
>(resources: T[], subscriptionTier: SubscriptionTier): T[] {
	return resources.filter((resource) =>
		canAccessResourceTier(subscriptionTier, resource.metadata?.tier),
	)
}

/**
 * Get resource tier from module resource metadata
 * @param moduleResources - Array of module resources
 * @param resourceId - The resource ID to find
 * @returns The resource tier or undefined
 */
export function getResourceTierFromModule(
	moduleResources:
		| Array<{
				resourceId?: string
				resource?: { id?: string }
				metadata?: { tier?: ResourceTier }
		  }>
		| undefined,
	resourceId: string,
): ResourceTier {
	if (!moduleResources) return undefined

	const found = moduleResources.find(
		(r) => r.resourceId === resourceId || r.resource?.id === resourceId,
	)

	return found?.metadata?.tier
}
