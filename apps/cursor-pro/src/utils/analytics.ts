import {
	identify as amplitudeIdentify,
	track as amplitudeTrack,
	Identify,
} from '@amplitude/analytics-browser'
import { track as defaultTrack } from '@skillrecordings/analytics'

export async function track(event: string, params?: any) {
	console.debug(`track ${event}`, params)
	amplitudeTrack(event, params)
	return defaultTrack(event, params)
}

export async function identify(userId: Identify) {
	amplitudeIdentify(userId)
}
