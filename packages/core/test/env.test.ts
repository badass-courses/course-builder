import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest'

import { CourseBuilderConfig, setEnvDefaults } from '../src/index.js'
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
})
