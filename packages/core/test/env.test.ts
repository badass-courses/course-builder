import { beforeEach, describe, expect, it } from 'vitest'

import { CourseBuilderConfig, setEnvDefaults } from '../src'
import Deepgram from '../src/providers/deepgram.js'

const testConfig: CourseBuilderConfig = {
	providers: [Deepgram],
}

let courseBuilderConfig: CourseBuilderConfig

beforeEach(() => {
	courseBuilderConfig = { ...testConfig } // clone
})

describe('config is inferred from environment variables', () => {
	it('providers (client id, client secret, issuer, api key)', () => {
		const env = {
			COURSEBUILDER_DEEPGRAM_API_KEY: 'fdsa',
		}
		setEnvDefaults(env, courseBuilderConfig)
		const [p1] = courseBuilderConfig.providers
		// @ts-expect-error
		expect(p1.apiKey).toBe(env.COURSEBUILDER_DEEPGRAM_API_KEY)
	})

	it('COURSEBUILDER_URL', () => {
		const env = { COURSEBUILDER_URL: 'http://n/api/coursebuilder' }
		setEnvDefaults(env, courseBuilderConfig)
		expect(courseBuilderConfig.basePath).toBe('/api/coursebuilder')
	})

	it('COURSEBUILDER_URL + prefer config', () => {
		const env = { COURSEBUILDER_URL: 'http://n/api/coursebuilder' }
		const fromConfig = '/basepath-from-config'
		courseBuilderConfig.basePath = fromConfig
		setEnvDefaults(env, courseBuilderConfig)
		expect(courseBuilderConfig.basePath).toBe(fromConfig)
	})

	it('COURSEBUILDER_URL, but invalid value', () => {
		const env = { COURSEBUILDER_URL: 'secret' }
		setEnvDefaults(env, courseBuilderConfig)
		expect(courseBuilderConfig.basePath).toBe('/coursebuilder')
	})
})
