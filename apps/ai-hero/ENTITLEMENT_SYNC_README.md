# Entitlement Sync System

This system automatically syncs user entitlements when cohorts are updated (resources added/removed/reordered).

## How It Works

1. **Current System**: When users purchase a cohort, individual entitlements are created for each resource in the cohort at that time
2. **Problem**: When new workshops are added to existing cohorts, users who purchased before don't get access to the new content
3. **Solution**: This sync system automatically updates entitlements when cohorts are modified

## Components

### 1. Events (`src/inngest/events/cohort-management.ts`)
- `COHORT_UPDATED_EVENT`: Triggered when a cohort is updated
- `COHORT_RESOURCE_ADDED_EVENT`: Triggered when a resource is added
- `COHORT_RESOURCE_REMOVED_EVENT`: Triggered when a resource is removed
- `PRODUCT_UPDATED_EVENT`: Triggered when a product is updated

### 2. Sync Functions (`src/lib/entitlement-sync.ts`)
- `findUsersWithCohortEntitlements()`: Find all users with entitlements for a cohort
- `syncUserCohortEntitlements()`: Sync entitlements for a specific user
- `syncAllCohortEntitlements()`: Sync entitlements for all users of a cohort
- `calculateEntitlementChanges()`: Calculate what changes are needed

### 3. Inngest Workflow (`src/inngest/functions/cohort-entitlement-sync-workflow.ts`)
- Automatically triggered when `COHORT_UPDATED_EVENT` is sent
- Processes all users with entitlements for the updated cohort
- Adds entitlements for new resources
- Removes entitlements for removed resources

### 4. Trigger Functions (`src/lib/cohort-update-trigger.ts`)
- `triggerCohortEntitlementSync()`: Main function to trigger sync
- `triggerResourceAddedSync()`: Helper for when resources are added
- `triggerResourceRemovedSync()`: Helper for when resources are removed
- `triggerResourceReorderedSync()`: Helper for when resources are reordered

### 5. Manual Functions (`src/lib/manual-entitlement-sync.ts`)
- `manualCohortEntitlementSync()`: Manual sync for admin use
- `getCohortEntitlementSyncStatus()`: Get sync status for a cohort

## Usage

### Automatic Sync (Recommended)

When you update a cohort in your admin interface, call the trigger function:

```typescript
import { triggerCohortEntitlementSync } from '@/lib/cohort-update-trigger'

// When adding a new workshop to a cohort
await triggerCohortEntitlementSync(cohortId, {
  resourcesAdded: [{ resourceId: 'new-workshop-id', position: 5 }]
})

// When removing a workshop from a cohort
await triggerCohortEntitlementSync(cohortId, {
  resourcesRemoved: [{ resourceId: 'old-workshop-id' }]
})

// When reordering workshops
await triggerCohortEntitlementSync(cohortId, {
  resourcesReordered: [
    { resourceId: 'workshop-1', oldPosition: 1, newPosition: 2 },
    { resourceId: 'workshop-2', oldPosition: 2, newPosition: 1 }
  ]
})
```

### Manual Sync (Admin Use)

For testing or fixing issues:

```typescript
import { manualCohortEntitlementSync } from '@/lib/manual-entitlement-sync'

// Sync all entitlements for a cohort
const result = await manualCohortEntitlementSync(cohortId, adminUserId)

console.log(`Synced ${result.results.length} users successfully`)
console.log(`Failed to sync ${result.errors.length} users`)
```

### Check Sync Status

```typescript
import { getCohortEntitlementSyncStatus } from '@/lib/manual-entitlement-sync'

const status = await getCohortEntitlementSyncStatus(cohortId)
console.log(`Cohort has ${status.totalUsers} users with entitlements`)
```

## Integration Points

To integrate this into your existing cohort management system:

1. **After adding a resource to a cohort**:
   ```typescript
   // Your existing code to add resource to cohort
   await addResourceToCohort(cohortId, resourceId, position)
   
   // Trigger entitlement sync
   await triggerResourceAddedSync(cohortId, resourceId, position, resourceType)
   ```

2. **After removing a resource from a cohort**:
   ```typescript
   // Your existing code to remove resource from cohort
   await removeResourceFromCohort(cohortId, resourceId)
   
   // Trigger entitlement sync
   await triggerResourceRemovedSync(cohortId, resourceId)
   ```

3. **After reordering resources in a cohort**:
   ```typescript
   // Your existing code to reorder resources
   await reorderCohortResources(cohortId, newOrder)
   
   // Trigger entitlement sync
   await triggerResourceReorderedSync(cohortId, reorderedResources)
   ```

## Monitoring

The system provides comprehensive logging:

- `cohort_entitlement_sync.workflow_started`: When sync workflow starts
- `cohort_entitlement_sync.workflow_completed`: When sync workflow completes
- `entitlement_sync.completed`: When individual user sync completes
- `entitlement_sync.failed`: When individual user sync fails
- `manual_entitlement_sync.started`: When manual sync starts
- `manual_entitlement_sync.completed`: When manual sync completes

## Testing

To test the system:

1. Create a test cohort with some resources
2. Purchase the cohort with a test user
3. Add a new resource to the cohort
4. Trigger the sync: `await triggerResourceAddedSync(cohortId, newResourceId, position, 'workshop')`
5. Verify the user now has access to the new resource

## Error Handling

The system handles various error scenarios:

- **Missing entitlement type**: Logs error and stops processing
- **Missing user membership**: Logs error and skips user
- **Database transaction failures**: Rolls back changes and logs error
- **Network issues**: Retries automatically via Inngest

## Performance Considerations

- Sync is processed asynchronously via Inngest
- Large cohorts are processed in batches
- Failed syncs are logged but don't stop the entire process
- Database operations are wrapped in transactions for consistency 