import { env } from '@/env.mjs'
import { Axiom } from '@axiomhq/js'

const axiom = new Axiom({
	token: process.env.AXIOM_TOKEN!,
	orgId: 'egghead',
	onError: (err) => {
		if (env.NODE_ENV === 'development') {
			console.error('Axiom logging error:', err)
		}
	},
})

type LogLevel = 'info' | 'error' | 'warn' | 'debug'

export const log = {
	async write(level: LogLevel, dataset: string, data: Record<string, any>) {
		try {
			await axiom.ingest(env.NEXT_PUBLIC_AXIOM_DATASET!, [
				{
					_time: new Date().toISOString(),
					level,
					event: dataset,
					...data,
				},
			])
		} catch (error) {
			// Error handling is done by onError callback
		}
	},

	async info(dataset: string, data: Record<string, any>) {
		return this.write('info', dataset, data)
	},

	async error(dataset: string, data: Record<string, any>) {
		return this.write('error', dataset, data)
	},

	async warn(dataset: string, data: Record<string, any>) {
		return this.write('warn', dataset, data)
	},

	async debug(dataset: string, data: Record<string, any>) {
		return this.write('debug', dataset, data)
	},

	async flush() {
		return axiom.flush()
	},
}
