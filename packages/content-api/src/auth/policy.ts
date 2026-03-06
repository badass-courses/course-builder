import type { ContentResource } from '@coursebuilder/core/schemas/content-resource-schema'

export type User = {
  id: string
  role?: string
  email?: string
}

export type AuthorizationPolicy = {
  canReadResource(input: {
    resource: ContentResource
    user?: User
  }): boolean | Promise<boolean>

  canManageLink(input: {
    parent: ContentResource
    child: ContentResource
    user?: User
  }): boolean | Promise<boolean>
}

export function createOpenPolicy(): AuthorizationPolicy {
  return {
    canReadResource: () => true,
    canManageLink: () => true,
  }
}

export function createAdminOnlyPolicy(): AuthorizationPolicy {
  return {
    canReadResource: ({ user }) => user?.role === 'admin',
    canManageLink: ({ user }) => user?.role === 'admin',
  }
}
