export type Awaitable<T> = T | PromiseLike<T>

export interface ContentResource {
  id: string
  type: string
  createdById: string
  fields: Record<string, any> | null
}
