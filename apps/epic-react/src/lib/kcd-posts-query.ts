'use server'

import { env } from '@/env.mjs'
import { Post, PostUpdate } from '@/lib/posts'
import mysql from 'mysql2/promise'

import 'server-only'

import { courseBuilderAdapter } from '@/db'

import { getPost } from './posts-query'
import { getVideoResource } from './video-resource-query'

const dbConnection = mysql.createPool({
	uri: env.DATABASE_URL,
})

export async function getKcdUserByEmail(email?: string) {
	if (!email) {
		return null
	}
	const connection = await dbConnection.getConnection()
	try {
		const [rows] = await connection.execute(
			'SELECT * FROM User WHERE email = ?',
			[email],
		)
		const [kcdUser] = rows as any[]
		return kcdUser
	} finally {
		connection.release()
	}
}

export async function insertVideoResource(videoResourceId: string) {
	const videoResource =
		await courseBuilderAdapter.getContentResource(videoResourceId)

	if (!videoResource) {
		throw new Error('🚨 Video resource not found')
	}
	const builderUser = await courseBuilderAdapter?.getUser?.(
		videoResource.createdById,
	)

	const connection = await dbConnection.getConnection()
	try {
		const kcdUser = await getKcdUserByEmail(builderUser?.email)
		if (!kcdUser) {
			throw new Error(`No KCD user found for email: ${builderUser?.email}`)
		}
		await connection.execute(
			'INSERT INTO ContentResource (id, type, fields, createdAt, updatedAt, createdById ) VALUES (?, ?, ?, NOW(), NOW(), ?)',
			[
				videoResource.id,
				'videoResource',
				JSON.stringify({
					...videoResource.fields,
				}),
				kcdUser.id,
			],
		)
	} finally {
		connection.release()
	}
}

export async function insertPostResource(postId: string, resourceId: string) {
	const connection = await dbConnection.getConnection()
	try {
		await connection.execute(
			'INSERT INTO ContentResourceResource (resourceOfId, resourceId, metadata) VALUES (?, ?, ?)',
			[postId, resourceId, JSON.stringify({})],
		)
	} finally {
		connection.release()
	}
}

export async function removePostResource(postId: string, resourceId: string) {
	const connection = await dbConnection.getConnection()
	try {
		await connection.execute(
			'DELETE FROM ContentResourceResource WHERE resourceOfId = ? AND resourceId = ?',
			[postId, resourceId],
		)
	} finally {
		connection.release()
	}
}

export async function insertPost(post: Post) {
	console.log('post', post)
	const connection = await dbConnection.getConnection()

	try {
		const builderUser = await courseBuilderAdapter?.getUser?.(post.createdById)
		const [rows] = await connection.execute(
			'SELECT * FROM User WHERE email = ?',
			[builderUser?.email],
		)
		const [kcdUser] = rows as any[]

		if (!kcdUser) {
			throw new Error(`No KCD user found for email: ${builderUser?.email}`)
		}

		await connection.execute(
			'INSERT INTO ContentResource (id, type, fields, createdAt, updatedAt, createdById) VALUES (?, ?, ?, ?, ?, ?)',
			[
				post.id,
				post.type,
				JSON.stringify({
					...post.fields,
				}),
				post.createdAt,
				post.updatedAt,
				kcdUser.id,
			],
		)
	} finally {
		connection.release()
	}
}

export async function updatePost(postUpdate: PostUpdate) {
	const connection = await dbConnection.getConnection()
	const post = await getPost(postUpdate.id)
	try {
		await connection.execute(
			'UPDATE ContentResource SET fields = JSON_MERGE_PATCH(fields, ?), updatedAt = NOW() WHERE id = ?',
			[
				JSON.stringify({
					...postUpdate.fields,
				}),
				postUpdate.id,
			],
		)
	} finally {
		connection.release()
	}
}

export async function deletePost(id: string) {
	const connection = await dbConnection.getConnection()
	try {
		await connection.execute('DELETE FROM ContentResource WHERE id = ?', [id])
		await connection.execute(
			'DELETE FROM ContentResourceResource WHERE resourceOfId = ?',
			[id],
		)
	} finally {
		connection.release()
	}
}
