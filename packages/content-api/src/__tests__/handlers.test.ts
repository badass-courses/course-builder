import { describe, it, expect, vi } from 'vitest'
import { getResource } from '../handlers/get-resource'
import { createLink } from '../handlers/create-link'
import { deleteLink } from '../handlers/delete-link'
import { listResources } from '../handlers/list-resources'
import { getChildren } from '../handlers/get-children'
import { getParents } from '../handlers/get-parents'
import type { HandlerContext, ContentApiAdapter } from '../handlers/context'
import { createOpenPolicy, createAdminOnlyPolicy } from '../auth/policy'
import { createSchemaRegistry } from '../schemas/content-model'

function createFakeResource(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res-1',
    type: 'post',
    createdById: 'user-1',
    fields: { title: 'Test', slug: 'test' },
    slug: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    currentVersionId: null,
    resources: [],
    resourceProducts: [],
    organizationId: null,
    createdByOrganizationMembershipId: null,
    ...overrides,
  }
}

function createFakeAdapter(overrides: Partial<ContentApiAdapter> = {}) {
  return {
    getContentResource: vi.fn(),
    queryContentResources: vi.fn(),
    getResourceChildren: vi.fn(),
    getResourceParents: vi.fn(),
    addResourceToResource: vi.fn(),
    removeResourceFromResource: vi.fn(),
    ...overrides,
  } as unknown as ContentApiAdapter
}

function createCtx(overrides: Partial<HandlerContext> = {}): HandlerContext {
  return {
    adapter: createFakeAdapter(),
    authorize: createOpenPolicy(),
    user: { id: 'user-1', role: 'admin' },
    ...overrides,
  }
}

describe('getResource', () => {
  it('returns 200 with resource when found and authorized', async () => {
    const resource = createFakeResource()
    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockResolvedValue(resource),
    })
    const ctx = createCtx({ adapter })

    const result = await getResource('res-1', ctx)

    expect(result.status).toBe(200)
    expect((result.body as { ok: true; data: unknown }).data).toEqual(resource)
  })

  it('returns 404 when resource not found', async () => {
    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockResolvedValue(null),
    })
    const ctx = createCtx({ adapter })

    const result = await getResource('nonexistent', ctx)

    expect(result.status).toBe(404)
    expect((result.body as { ok: false; error: { code: string } }).error.code).toBe('NOT_FOUND')
  })

  it('returns 403 when authorization fails', async () => {
    const resource = createFakeResource()
    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockResolvedValue(resource),
    })
    const ctx = createCtx({
      adapter,
      authorize: createAdminOnlyPolicy(),
      user: { id: 'user-1', role: 'user' },
    })

    const result = await getResource('res-1', ctx)

    expect(result.status).toBe(403)
  })
})

describe('listResources', () => {
  it('returns filtered resources based on auth policy', async () => {
    const resources = [
      createFakeResource({ id: 'res-1' }),
      createFakeResource({ id: 'res-2' }),
    ]
    const adapter = createFakeAdapter({
      queryContentResources: vi.fn().mockResolvedValue({
        data: resources,
        pagination: { page: 1, limit: 25, total: 2, totalPages: 1 },
      }),
    })

    let callCount = 0
    const ctx = createCtx({
      adapter,
      authorize: {
        canReadResource: () => {
          callCount++
          return callCount <= 1
        },
        canManageLink: () => true,
      },
    })

    const result = await listResources({ page: 1, limit: 25, sort: 'updatedAt', order: 'desc' }, ctx)

    expect(result.status).toBe(200)
    const body = result.body as { ok: true; data: { data: unknown[] } }
    expect(body.data.data).toHaveLength(1)
  })
})

describe('getChildren', () => {
  it('returns children when parent found', async () => {
    const parent = createFakeResource()
    const children = [createFakeResource({ id: 'child-1', type: 'lesson' })]
    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockResolvedValue(parent),
      getResourceChildren: vi.fn().mockResolvedValue(children),
    })
    const ctx = createCtx({ adapter })

    const result = await getChildren('res-1', ctx)

    expect(result.status).toBe(200)
    expect((result.body as { ok: true; data: unknown[] }).data).toEqual(children)
  })

  it('returns 404 when parent not found', async () => {
    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockResolvedValue(null),
    })
    const ctx = createCtx({ adapter })

    const result = await getChildren('nonexistent', ctx)
    expect(result.status).toBe(404)
  })
})

describe('getParents', () => {
  it('returns parents when resource found', async () => {
    const resource = createFakeResource()
    const parents = [createFakeResource({ id: 'parent-1', type: 'section' })]
    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockResolvedValue(resource),
      getResourceParents: vi.fn().mockResolvedValue(parents),
    })
    const ctx = createCtx({ adapter })

    const result = await getParents('res-1', ctx)

    expect(result.status).toBe(200)
    expect((result.body as { ok: true; data: unknown[] }).data).toEqual(parents)
  })
})

describe('createLink', () => {
  it('creates a link when edge is valid', async () => {
    const parent = createFakeResource({ id: 'lesson-1', type: 'lesson' })
    const child = createFakeResource({ id: 'video-1', type: 'videoResource' })
    const link = { resourceOfId: 'lesson-1', resourceId: 'video-1', position: 0 }

    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockImplementation((id: string) => {
        if (id === 'lesson-1') return Promise.resolve(parent)
        if (id === 'video-1') return Promise.resolve(child)
        return Promise.resolve(null)
      }),
      addResourceToResource: vi.fn().mockResolvedValue(link),
    })

    const registry = createSchemaRegistry()
      .withEdges([{ parentType: 'lesson', childType: 'videoResource' }])

    const ctx = createCtx({ adapter, registry })

    const result = await createLink(
      { parentId: 'lesson-1', childId: 'video-1' },
      ctx,
    )

    expect(result.status).toBe(201)
  })

  it('rejects invalid edge with 422', async () => {
    const parent = createFakeResource({ id: 'transcript-1', type: 'raw-transcript' })
    const child = createFakeResource({ id: 'workshop-1', type: 'workshop' })

    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockImplementation((id: string) => {
        if (id === 'transcript-1') return Promise.resolve(parent)
        if (id === 'workshop-1') return Promise.resolve(child)
        return Promise.resolve(null)
      }),
    })

    const registry = createSchemaRegistry()
      .withEdges([{ parentType: 'lesson', childType: 'videoResource' }])

    const ctx = createCtx({ adapter, registry })

    const result = await createLink(
      { parentId: 'transcript-1', childId: 'workshop-1' },
      ctx,
    )

    expect(result.status).toBe(422)
    expect((result.body as { ok: false; error: { code: string } }).error.code).toBe('INVALID_EDGE')
  })

  it('rejects unauthorized link creation with 403', async () => {
    const parent = createFakeResource({ id: 'lesson-1', type: 'lesson' })
    const child = createFakeResource({ id: 'video-1', type: 'videoResource' })

    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockImplementation((id: string) => {
        if (id === 'lesson-1') return Promise.resolve(parent)
        if (id === 'video-1') return Promise.resolve(child)
        return Promise.resolve(null)
      }),
    })

    const registry = createSchemaRegistry()
      .withEdges([{ parentType: 'lesson', childType: 'videoResource' }])

    const ctx = createCtx({
      adapter,
      registry,
      authorize: createAdminOnlyPolicy(),
      user: { id: 'user-1', role: 'user' },
    })

    const result = await createLink(
      { parentId: 'lesson-1', childId: 'video-1' },
      ctx,
    )

    expect(result.status).toBe(403)
  })

  it('returns 400 for invalid body', async () => {
    const ctx = createCtx()

    const result = await createLink({ parentId: 123 }, ctx)

    expect(result.status).toBe(400)
    expect((result.body as { ok: false; error: { code: string } }).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('deleteLink', () => {
  it('deletes a link successfully', async () => {
    const parent = createFakeResource({ id: 'lesson-1', type: 'lesson' })
    const child = createFakeResource({ id: 'video-1', type: 'videoResource' })

    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockImplementation((id: string) => {
        if (id === 'lesson-1') return Promise.resolve(parent)
        if (id === 'video-1') return Promise.resolve(child)
        return Promise.resolve(null)
      }),
      removeResourceFromResource: vi.fn().mockResolvedValue(child),
    })

    const ctx = createCtx({ adapter })

    const result = await deleteLink(
      { parentId: 'lesson-1', childId: 'video-1' },
      ctx,
    )

    expect(result.status).toBe(200)
  })

  it('returns 404 when parent not found', async () => {
    const adapter = createFakeAdapter({
      getContentResource: vi.fn().mockResolvedValue(null),
    })
    const ctx = createCtx({ adapter })

    const result = await deleteLink(
      { parentId: 'nonexistent', childId: 'video-1' },
      ctx,
    )

    expect(result.status).toBe(404)
  })
})
