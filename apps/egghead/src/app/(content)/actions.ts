'use server'

import { type StreamingTextResponse } from 'ai'

export async function generateSocialSizedSummary({
	transcript,
	link,
}: {
	transcript: string
	link: string
}): Promise<StreamingTextResponse> {
	return await fetch('/api/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
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
					content: `Create a concise, engaging summary of this post, highlighting the key points in a way that would be suitable for a social media post in less than 300 characters. Please don\'t include hashtags. Include the link at the end of the post. --- post: ${transcript}. --- link: ${link}`,
				},
			],
		}),
	})
}
