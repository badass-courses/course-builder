import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { createSchemaRegistry } from '../schemas/content-model'
import type { EdgeRule } from '../schemas/edge-matrix'

describe('createSchemaRegistry', () => {
  it('registers a resource type and retrieves the model', () => {
    const fields = z.object({ title: z.string(), slug: z.string() })

    const registry = createSchemaRegistry().register(
      'post',
      fields,
      ['create', 'read', 'update', 'delete'],
    )

    const model = registry.getModel()

    expect(model.resourceTypes).toHaveLength(1)
    expect(model.resourceTypes[0]!.type).toBe('post')
    expect(model.resourceTypes[0]!.operations).toEqual([
      'create',
      'read',
      'update',
      'delete',
    ])
    expect(model.resourceTypes[0]!.label).toBe('post')
    expect(model.resourceTypes[0]!.states).toEqual([
      'draft',
      'published',
      'archived',
      'deleted',
    ])
  })

  it('supports custom label and states', () => {
    const fields = z.object({ title: z.string() })

    const registry = createSchemaRegistry().register(
      'lesson',
      fields,
      ['read', 'update'],
      { label: 'Lesson', states: ['draft', 'published'] },
    )

    const model = registry.getModel()
    expect(model.resourceTypes[0]!.label).toBe('Lesson')
    expect(model.resourceTypes[0]!.states).toEqual(['draft', 'published'])
  })

  it('registers multiple types via chaining', () => {
    const postFields = z.object({ title: z.string(), slug: z.string() })
    const lessonFields = z.object({ title: z.string() })

    const registry = createSchemaRegistry()
      .register('post', postFields, ['create', 'read', 'update', 'delete'])
      .register('lesson', lessonFields, ['read', 'update'])

    expect(registry.getRegisteredTypes()).toEqual(['post', 'lesson'])
  })

  it('sets edges via withEdges', () => {
    const edges: EdgeRule[] = [
      { parentType: 'lesson', childType: 'videoResource' },
      { parentType: 'section', childType: 'lesson' },
    ]

    const registry = createSchemaRegistry().withEdges(edges)
    expect(registry.getEdges()).toEqual(edges)
    expect(registry.getModel().edges).toEqual(edges)
  })

  it('sets constraints via withConstraints', () => {
    const registry = createSchemaRegistry().withConstraints({ maxDepth: 5 })
    expect(registry.getModel().constraints).toEqual({ maxDepth: 5 })
  })

  it('retrieves type definition by type string', () => {
    const fields = z.object({ title: z.string() })

    const registry = createSchemaRegistry().register(
      'post',
      fields,
      ['read'],
    )

    const def = registry.getTypeDefinition('post')
    expect(def).toBeDefined()
    expect(def!.type).toBe('post')

    const missing = registry.getTypeDefinition('nonexistent')
    expect(missing).toBeUndefined()
  })
})
