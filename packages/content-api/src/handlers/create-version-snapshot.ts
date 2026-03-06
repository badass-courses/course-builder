import type { ContentApiAdapter } from './context'

export type VersionSnapshot = {
  resourceId: string
  versionNumber: number
  fields: Record<string, unknown>
}

export async function createVersionSnapshot(
  resourceId: string,
  userId: string,
  adapter: ContentApiAdapter,
): Promise<VersionSnapshot | null> {
  const resource = await adapter.getContentResource(resourceId)

  if (!resource) {
    return null
  }

  if (!adapter.createVersionSnapshot) {
    return null
  }

  return adapter.createVersionSnapshot(resourceId, userId, resource.fields ?? {})
}
