// Re-export everything from flags
export * from './flags'

// Re-export specific types and constants that consumers need
export type { Environment } from './flags-env'
export { getEnvironment } from './flags-env'
export type { FlagConfig, FlagKey } from './flag-definitions'
export { FLAGS, COMMERCE_ENABLED, SHOW_TEAM_PRICING } from './flag-definitions'
