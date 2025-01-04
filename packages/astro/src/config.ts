import type { AuthConfig } from '@auth/core/types'

export interface CoursebuilderConfig {
	/**
	 * Defines the base path for the coursebuilder routes.
	 * @default "/api/coursebuilder"
	 */
	prefix?: string
}

export interface FullCoursebuilderConfig extends CoursebuilderConfig, Omit<AuthConfig, 'raw'> {}

export function defineConfig(config: Partial<FullCoursebuilderConfig> = {}) {
	config.prefix ??= '/api/coursebuilder'
	return config as FullCoursebuilderConfig
}
