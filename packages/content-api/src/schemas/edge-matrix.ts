import { z } from 'zod'

export const EdgeRuleSchema = z.object({
  parentType: z.string(),
  childType: z.string(),
  maxChildren: z.number().optional(),
  required: z.boolean().optional(),
})

export type EdgeRule = z.infer<typeof EdgeRuleSchema>

export function validateEdge(
  edges: EdgeRule[],
  parentType: string,
  childType: string,
): boolean {
  return edges.some(
    (edge) => edge.parentType === parentType && edge.childType === childType,
  )
}
