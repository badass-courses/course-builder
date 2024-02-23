/**
 * Backend provides the APIs to implement a backend adapter as well
 * as several built-in backend adapters. These are instantiated and
 * passed to `setup` for a working SPA.
 *
 * @module
 */
import { RawNode } from '../model/mod'

/**
 * Backend is the adapter object API to be implemented for a working backend.
 * Typically these fields are set to `this` and the different APIs are
 * implemented on the same object.
 */
export interface Backend {
  auth: Authenticator | null
  index: SearchIndex
  files: FileStore
  loadExtensions?: any
  initialize?: any
}

export interface Authenticator {
  login(): any
  logout(): any
  currentUser(): User | null
}

export interface User {
  userID(): string
  displayName(): string
  avatarURL(): string
}

export interface SearchIndex {
  index(node: RawNode): any
  remove(id: string): any
  search(query: string): string[]
}

export interface FileStore {
  readFile(path: string): Promise<string | null>
  writeFile(path: string, contents: string): Promise<any>
}
