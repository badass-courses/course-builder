import { ResourceFormConfig } from '@/components/resource-form/with-resource-form'
import { Post, PostSchema, PostUpdate } from '@/lib/posts'
import { autoUpdatePost, getPost, updatePost } from '@/lib/posts-query'
import { z } from 'zod'

/**
 * Configuration for the post form including schema validation and resource handling
 */
export const postFormConfig: ResourceFormConfig<Post, typeof PostSchema> = {
	resourceType: 'post',
	schema: PostSchema,
	defaultValues: (post?: Post) => {
		if (!post) {
			return {
				type: 'post',
				fields: {
					title: '',
					body: '',
					visibility: 'public',
					description: '',
					github: '',
					gitpod: '',
					state: 'draft',
					thumbnailTime: 0,
					postType: 'article',
					slug: '',
					summary: null,
					yDoc: null,
				},
				id: '',
				organizationId: null,
				createdAt: null,
				updatedAt: null,
				deletedAt: null,
				createdById: '',
				resources: [],
				createdByOrganizationMembershipId: null,
				tags: [],
			} as Post
		}

		return {
			...post,
			fields: {
				...post.fields,
				title: post.fields?.title || '',
				body: post.fields?.body || '',
				slug: post.fields?.slug || '',
				visibility: post.fields?.visibility || 'public',
				state: post.fields?.state || 'draft',
				description: post.fields?.description ?? '',
				github: post.fields?.github ?? '',
				gitpod: post.fields?.gitpod ?? '',
				thumbnailTime: post.fields?.thumbnailTime ?? 0,
				postType: post.fields?.postType || 'article',
				summary: post.fields?.summary ?? null,
				yDoc: post.fields?.yDoc ?? null,
			},
		}
	},
	getResourcePath: (slug?: string) => `/${slug || ''}`,
	updateResource: async (resource: Partial<Post>) => {
		if (!resource.id || !resource.fields) {
			throw new Error('Invalid resource data')
		}
		const currentPost = await getPost(resource.id)

		const postUpdate: PostUpdate = {
			id: resource.id,
			fields: {
				...(currentPost?.fields || {}),
				title: resource.fields.title || '',
				body: resource.fields.body || '',
				slug: resource.fields.slug || '',
				description: resource.fields.description || '',
				state: resource.fields.state || 'draft',
				visibility: resource.fields.visibility || 'public',
				github: resource.fields.github || '',
				thumbnailTime: resource.fields.thumbnailTime || 0,
				postType: resource.fields.postType || 'article',
			},
			tags: resource.tags || [],
		}
		const result = await updatePost(postUpdate)
		return result as Post
	},
	autoUpdateResource: async (resource: Partial<Post>) => {
		console.log('autoUpdateResource', resource)
		if (!resource.id || !resource.fields) {
			throw new Error('Invalid resource data')
		}
		const currentPost = await getPost(resource.id)

		const postUpdate: PostUpdate = {
			id: resource.id,
			fields: {
				...(currentPost?.fields || {}),
				title: resource.fields.title || '',
				body: resource.fields.body || '',
				slug: resource.fields.slug || '',
				description: resource.fields.description || '',
				state: resource.fields.state || 'draft',
				visibility: resource.fields.visibility || 'public',
				github: resource.fields.github || '',
				thumbnailTime: resource.fields.thumbnailTime || 0,
				postType: resource.fields.postType || 'article',
			},
			tags: resource.tags || [],
		}
		const result = await autoUpdatePost(postUpdate)
		return result as Post
	},
	createPostConfig: {
		title: 'Create a Resource',
		defaultResourceType: 'article',
		availableResourceTypes: ['article', 'tip', 'podcast'],
	},
	bodyPanelConfig: {
		showListResources: false,
	},
}
