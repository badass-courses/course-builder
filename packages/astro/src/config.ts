import type { AuthConfig } from '@auth/core/types'
import type { PluginOption } from 'vite'

export const virtualConfigModule = (
	configFile: string = './coursebuilder.config'
): PluginOption => {
	const virtualModuleId = 'coursebuilder:config'
	const resolvedId = '\0' + virtualModuleId

	return {
		name: 'coursebuilder-astro-config',
		resolveId: (id) => {
			if (id === virtualModuleId) {
				return resolvedId
			}
		},
		load: (id) => {
			if (id === resolvedId) {
				return `import coursebuilderConfig from "${configFile}"; export default coursebuilderConfig`
			}
		},
	}
}

export interface CoursebuilderConfig {
	/**
	 * Defines the base path for the coursebuilder routes.
	 * @default "/api/coursebuilder"
	 */
	prefix?: string
	/**
	 * Defines whether or not you want the integration to handle the API routes
	 * @default true
	 */
	injectEndpoints?: boolean
	/**
	 * Path to the config file
	 */
	configFile?: string
}

export interface FullCoursebuilderConfig extends CoursebuilderConfig, Omit<AuthConfig, 'raw'> {}

export function defineConfig(config: Partial<FullCoursebuilderConfig> = {}) {
	config.prefix ??= '/api/coursebuilder'
	config.basePath = config.prefix
	return config as FullCoursebuilderConfig
}
