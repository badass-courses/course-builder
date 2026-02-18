/**
 * Export Workshop to Sanity Format
 *
 * Usage:
 *   pnpm tsx src/scripts/export-workshop-to-sanity.ts <workshop-slug-or-id>
 *
 * Example:
 *   pnpm tsx src/scripts/export-workshop-to-sanity.ts workshop~wvmvf
 */

// Load environment variables BEFORE any other imports
import { Client } from '@planetscale/database'
import dotenvFlow from 'dotenv-flow'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { and, asc, eq, or, relations, sql } from 'drizzle-orm'
import {
	double,
	json,
	mysqlTable,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'
import { drizzle } from 'drizzle-orm/planetscale-serverless'

dotenvFlow.config()

// -----------------------------------------------------------------------------
// Minimal Schema (with zEW_ prefix for epic-web)
// -----------------------------------------------------------------------------

const contentResource = mysqlTable('zEW_ContentResource', {
	id: varchar('id', { length: 255 }).notNull().primaryKey(),
	type: varchar('type', { length: 255 }).notNull(),
	createdById: varchar('createdById', { length: 255 }).notNull(),
	fields: json('fields').$type<Record<string, any>>().default({}),
	createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 }).defaultNow(),
	updatedAt: timestamp('updatedAt', { mode: 'date', fsp: 3 }).defaultNow(),
	deletedAt: timestamp('deletedAt', { mode: 'date', fsp: 3 }),
	organizationId: varchar('organizationId', { length: 255 }),
})

const contentResourceResource = mysqlTable(
	'zEW_ContentResourceResource',
	{
		resourceOfId: varchar('resourceOfId', { length: 255 }).notNull(),
		resourceId: varchar('resourceId', { length: 255 }).notNull(),
		position: double('position').notNull().default(0),
		metadata: json('metadata').$type<Record<string, any>>().default({}),
		createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 }).defaultNow(),
		updatedAt: timestamp('updatedAt', { mode: 'date', fsp: 3 }).defaultNow(),
		deletedAt: timestamp('deletedAt', { mode: 'date', fsp: 3 }),
	},
	(crr) => ({
		pk: primaryKey({ columns: [crr.resourceOfId, crr.resourceId] }),
	}),
)

const contentResourceProduct = mysqlTable(
	'zEW_ContentResourceProduct',
	{
		resourceId: varchar('resourceId', { length: 255 }).notNull(),
		productId: varchar('productId', { length: 255 }).notNull(),
		position: double('position').notNull().default(0),
		metadata: json('metadata').$type<Record<string, any>>().default({}),
		createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 }).defaultNow(),
		updatedAt: timestamp('updatedAt', { mode: 'date', fsp: 3 }).defaultNow(),
		deletedAt: timestamp('deletedAt', { mode: 'date', fsp: 3 }),
	},
	(crp) => ({
		pk: primaryKey({ columns: [crp.resourceId, crp.productId] }),
	}),
)

const products = mysqlTable('zEW_Product', {
	id: varchar('id', { length: 255 }).notNull().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	fields: json('fields').$type<Record<string, any>>().default({}),
})

// Relations for nested queries
const contentResourceRelations = relations(contentResource, ({ many }) => ({
	resources: many(contentResourceResource, { relationName: 'resourceOf' }),
	resourceProducts: many(contentResourceProduct),
}))

const contentResourceResourceRelations = relations(
	contentResourceResource,
	({ one }) => ({
		resourceOf: one(contentResource, {
			fields: [contentResourceResource.resourceOfId],
			references: [contentResource.id],
			relationName: 'resourceOf',
		}),
		resource: one(contentResource, {
			fields: [contentResourceResource.resourceId],
			references: [contentResource.id],
			relationName: 'resource',
		}),
	}),
)

const contentResourceProductRelations = relations(
	contentResourceProduct,
	({ one }) => ({
		resource: one(contentResource, {
			fields: [contentResourceProduct.resourceId],
			references: [contentResource.id],
		}),
		product: one(products, {
			fields: [contentResourceProduct.productId],
			references: [products.id],
		}),
	}),
)

const schema = {
	contentResource,
	contentResourceResource,
	contentResourceProduct,
	products,
	contentResourceRelations,
	contentResourceResourceRelations,
	contentResourceProductRelations,
}

// -----------------------------------------------------------------------------
// Types for output
// -----------------------------------------------------------------------------

interface SolutionOutput {
	title: string
	description: string | null
	muxAssetId: string | null
	muxPlaybackId: string | null
	transcript: string | null
	srt: string | null
	code: string | null
}

interface LessonOutput {
	type: 'lesson' | 'exercise'
	title: string
	description: string | null
	muxAssetId: string | null
	muxPlaybackId: string | null
	transcript: string | null
	srt: string | null
	code: string | null
	solution?: SolutionOutput
}

interface VideoData {
	muxAssetId: string | null
	muxPlaybackId: string | null
	transcript: string | null
	srt: string | null
}

// WorkshopOutput = { "Workshop Title": { "Section Title": LessonOutput[] } }
type WorkshopOutput = Record<string, Record<string, LessonOutput[]>>

// -----------------------------------------------------------------------------
// Database connection
// -----------------------------------------------------------------------------

function createDb() {
	const databaseUrl = process.env.DATABASE_URL

	if (!databaseUrl) {
		console.error('ERROR: DATABASE_URL environment variable is not set')
		console.error('')
		console.error('Make sure you have a .env.local file with DATABASE_URL')
		process.exit(1)
	}

	return drizzle(new Client({ url: databaseUrl }), { schema })
}

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

function extractFields(resource: any): Record<string, any> {
	return resource.fields || {}
}

// -----------------------------------------------------------------------------
// Database queries
// -----------------------------------------------------------------------------

async function getWorkshopWithFullHierarchy(
	db: ReturnType<typeof createDb>,
	workshopSlug: string,
) {
	const workshop = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					workshopSlug,
				),
				eq(contentResource.id, workshopSlug),
			),
			eq(contentResource.type, 'workshop'),
		),
		with: {
			resources: {
				// Level 1: sections
				with: {
					resource: {
						with: {
							resources: {
								// Level 2: lessons within sections
								with: {
									resource: {
										with: {
											resources: {
												// Level 3: solutions/videoResources within lessons
												with: {
													resource: {
														// Level 4: video resources within solutions
														with: {
															resources: {
																with: {
																	resource: true,
																},
																orderBy: asc(contentResourceResource.position),
															},
														},
													},
												},
												orderBy: asc(contentResourceResource.position),
											},
										},
									},
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	return workshop
}

// -----------------------------------------------------------------------------
// Transform functions
// -----------------------------------------------------------------------------

function transformSolution(solutionResource: any): SolutionOutput | null {
	if (!solutionResource || solutionResource.type !== 'solution') {
		return null
	}

	const fields = extractFields(solutionResource)

	// Look for video resource in nested resources
	let videoData: VideoData = {
		muxAssetId: null,
		muxPlaybackId: null,
		transcript: null,
		srt: null,
	}
	let codePath: string | null = null

	// Check nested resources for video resource and solution code
	if (solutionResource.resources) {
		for (const r of solutionResource.resources) {
			const res = r.resource
			if (res?.type === 'videoResource') {
				const vFields = res.fields || {}
				videoData = {
					muxAssetId: vFields.muxAssetId || null,
					muxPlaybackId: vFields.muxPlaybackId || null,
					transcript: vFields.transcript || null,
					srt: vFields.srt || vFields.wordLevelSrt || null,
				}
			}
			// Look for solution child that has workshopApp.path
			if (res?.type === 'solution' && res.fields?.workshopApp?.path) {
				codePath = res.fields.workshopApp.path
			}
			// Also check one level deeper
			if (res?.resources) {
				for (const rr of res.resources) {
					if (rr.resource?.type === 'videoResource') {
						const vFields = rr.resource.fields || {}
						if (!videoData.muxAssetId) {
							videoData = {
								muxAssetId: vFields.muxAssetId || null,
								muxPlaybackId: vFields.muxPlaybackId || null,
								transcript: vFields.transcript || null,
								srt: vFields.srt || vFields.wordLevelSrt || null,
							}
						}
					}
				}
			}
		}
	}

	// Check solution's own workshopApp.path
	if (!codePath && fields.workshopApp?.path) {
		codePath = fields.workshopApp.path
	}

	return {
		title: fields.title || 'Solution',
		description: fields.description || fields.body || null,
		muxAssetId: videoData.muxAssetId,
		muxPlaybackId: videoData.muxPlaybackId,
		transcript: videoData.transcript,
		srt: videoData.srt,
		code: codePath,
	}
}

function transformLesson(lessonWrapper: any): LessonOutput {
	const lesson = lessonWrapper.resource
	const fields = extractFields(lesson)

	// Check if it's an exercise (has solution)
	const hasSolution = lesson.resources?.some(
		(r: any) => r.resource?.type === 'solution',
	)
	const lessonType = hasSolution ? 'exercise' : 'lesson'

	// Find solution if exists
	const solutionWrapper = lesson.resources?.find(
		(r: any) => r.resource?.type === 'solution',
	)
	const solution = solutionWrapper
		? transformSolution(solutionWrapper.resource)
		: undefined

	// Find video data from video resource
	let videoData: VideoData = {
		muxAssetId: null,
		muxPlaybackId: null,
		transcript: null,
		srt: null,
	}
	// Find code path from exercise child resource (has workshopApp.path)
	let codePath: string | null = null

	if (lesson.resources) {
		for (const r of lesson.resources) {
			const res = r.resource
			if (res?.type === 'videoResource') {
				const vFields = res.fields || {}
				videoData = {
					muxAssetId: vFields.muxAssetId || null,
					muxPlaybackId: vFields.muxPlaybackId || null,
					transcript: vFields.transcript || null,
					srt: vFields.srt || vFields.wordLevelSrt || null,
				}
			}
			// Look for exercise child that has workshopApp.path (the problem code)
			if (res?.type === 'exercise') {
				const exFields = res.fields || {}
				if (exFields.workshopApp?.path) {
					codePath = exFields.workshopApp.path
				}
			}
		}
	}

	// If no exercise child found, check the lesson's own fields
	if (!codePath && fields.workshopApp?.path) {
		codePath = fields.workshopApp.path
	}

	const output: LessonOutput = {
		type: lessonType,
		title: fields.title || '',
		description: fields.description || fields.body || null,
		muxAssetId: videoData.muxAssetId,
		muxPlaybackId: videoData.muxPlaybackId,
		transcript: videoData.transcript,
		srt: videoData.srt,
		code: codePath,
	}

	if (solution) {
		output.solution = solution
	}

	return output
}

function transformWorkshop(workshop: any): WorkshopOutput {
	const workshopFields = extractFields(workshop)
	const workshopTitle = workshopFields.title || 'Workshop'

	const output: WorkshopOutput = {}
	output[workshopTitle] = {}

	let sectionIndex = 1

	for (const resourceWrapper of workshop.resources || []) {
		const resource = resourceWrapper.resource
		const resourceFields = extractFields(resource)

		if (resource.type === 'section') {
			const sectionTitle = resourceFields.title || `Section ${sectionIndex}`

			// Get lessons within this section
			const lessons: LessonOutput[] = []
			for (const lessonWrapper of resource.resources || []) {
				const lessonResource = lessonWrapper.resource
				if (
					lessonResource?.type === 'lesson' ||
					lessonResource?.type === 'exercise' ||
					lessonResource?.type === 'post'
				) {
					lessons.push(transformLesson(lessonWrapper))
				}
			}

			// Add lessons directly under section title
			output[workshopTitle]![sectionTitle] = lessons

			sectionIndex++
		} else if (
			resource.type === 'lesson' ||
			resource.type === 'exercise' ||
			resource.type === 'post'
		) {
			// Top-level lesson without section
			const introKey = 'Introduction'
			if (!output[workshopTitle]![introKey]) {
				output[workshopTitle]![introKey] = []
			}
			output[workshopTitle]![introKey]!.push(transformLesson(resourceWrapper))
		}
	}

	return output
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
	const workshopSlug = process.argv[2]

	if (!workshopSlug) {
		console.error(
			'Usage: pnpm tsx src/scripts/export-workshop-to-sanity.ts <workshop-slug-or-id>',
		)
		console.error('')
		console.error('Example:')
		console.error(
			'  pnpm tsx src/scripts/export-workshop-to-sanity.ts full-stack-foundations',
		)
		console.error(
			'  pnpm tsx src/scripts/export-workshop-to-sanity.ts workshop~wvmvf',
		)
		process.exit(1)
	}

	try {
		const db = createDb()

		console.error(`Fetching workshop: ${workshopSlug}`)

		const workshop = await getWorkshopWithFullHierarchy(db, workshopSlug)

		if (!workshop) {
			console.error(`Workshop not found: ${workshopSlug}`)
			process.exit(1)
		}

		const workshopFields = extractFields(workshop)
		console.error(`Found workshop: ${workshopFields.title}`)

		const output = transformWorkshop(workshop)

		// Create filename from workshop slug
		const safeSlug = workshopSlug.replace(/[^a-zA-Z0-9-_~]/g, '-')
		const outputFileName = `workshop-export-${safeSlug}.json`
		const outputPath = join(process.cwd(), outputFileName)

		// Write JSON to file
		writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

		console.error('')
		console.error('Export completed successfully!')
		console.error(`Output written to: ${outputPath}`)
	} catch (error) {
		console.error('Failed to export workshop:', error)
		process.exit(1)
	}

	process.exit(0)
}

main()
