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
    const split_points = await step.run('determining split points', async () => {
      determineSplitPoints(event.data.transcript)
    })

    return split_points
  },
)
