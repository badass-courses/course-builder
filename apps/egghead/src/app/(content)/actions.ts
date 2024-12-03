'use server'

import { env } from '@/env.mjs'
import { getChatResource } from '@/lib/ai-chat-query'
import { type StreamingTextResponse } from 'ai'

import { type ContentResource } from '@coursebuilder/core/schemas'

export async function generateSocialSizedSummary({
	post,
}: {
	post: ContentResource
}): Promise<StreamingTextResponse> {
	const resource = await getChatResource(post.id)

	return await fetch(`${env.NEXT_PUBLIC_URL}/api/chat`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			messages: [
				{
					role: 'system',
					content:
						'You are a social media expert that summarizes lesson transcripts in less than 300 characters.',
				},
				{
					role: 'user',
					content: `Create a concise, engaging summary of this ${post?.fields?.postType}, highlighting the key points in a way that would be suitable for a social media post in less than 300 characters. Please don\'t include hashtags. Include the link at the end of your summary. --- ${post?.fields?.postType} transcript: ${resource?.transcript}. --- link: https://egghead.io/${post?.fields?.slug}`,
				},
			],
		}),
	})
}
