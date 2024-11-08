import { inngest } from '@/inngest/inngest.server'
import { getEggheadUserProfile } from '@/lib/egghead'
import { NonRetriableError } from 'inngest'
import { customAlphabet } from 'nanoid'

import { POST_CREATED_EVENT } from '../events/post-created'

export const notifySlack = inngest.createFunction(
	{
		id: `notify-slack`,
		name: `Notify Slack`,
	},
	{
		event: POST_CREATED_EVENT,
	},
	async ({ event, step, notificationProvider }) => {
		const post = event.data.post

		if (!post) throw new NonRetriableError('No post found')

		const eggheadUser = await step.run('Get instructor', async () => {
			return await getEggheadUserProfile(post.createdById)
		})

		const instructor = eggheadUser?.instructor

		if (!instructor) throw new NonRetriableError('No instructor found')

		await step.run('Notify slack', async () => {
			await notificationProvider.sendNotification({
				channel: instructor.slack_group_id,
				text: `New ${post?.fields?.postType} created: ${post?.fields?.title}`,
				attachments: [
					{
						author_name: instructor.name ?? '',
						author_icon: instructor.image ?? '',
						mrkdwn_in: ['text'],
						title: post?.fields?.title ?? '',
						title_link: `${process.env.NEXT_PUBLIC_URL}/${post?.fields?.slug}`,
						text: post?.fields?.body ?? '',
						color: '#f17f08',
					},
				],
			})
		})
	},
)
