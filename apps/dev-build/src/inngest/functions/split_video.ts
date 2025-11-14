import { determineSplitPoints } from '@/transcript-processing/determine-split-points'

import { REQUEST_VIDEO_SPLIT_POINTS } from '../events/split_video'
import { inngest } from '../inngest.server'

export const computeVideoSplitPoints = inngest.createFunction(
	{
		id: `compute split points`,
		name: 'Compute Split Points',
	},
	{
		event: REQUEST_VIDEO_SPLIT_POINTS,
	},
	async ({ event, step }) => {
		const split_points = await step.run(
			'determining split points',
			async () => {
				return determineSplitPoints(event.data.transcript)
			},
		)

		// open question - do we want to return the split poinst here, or do we want to kick off an actual splitting of the video within this function?
		// feels like maybe we want to dispatch another event, onoe that maps split points to event.data.resource, and have that mapped to some sort of actual video splitting behavior?
		return split_points
	},
)
