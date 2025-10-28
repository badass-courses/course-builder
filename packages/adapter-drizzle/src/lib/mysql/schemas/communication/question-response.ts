import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getContentResourceSchema } from '../content/content-resource.js'

/**
 * Question response table - stores individual question responses
 * Supports surveys, quizzes, polls, and other question-based interactions
 * Works for both authenticated users and anonymous email subscribers
 */
export function getQuestionResponseSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'QuestionResponse',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			surveyId: varchar('surveyId', { length: 255 }).notNull(),
			questionId: varchar('questionId', { length: 255 }).notNull(),
			userId: varchar('userId', { length: 255 }),
			emailListSubscriberId: varchar('emailListSubscriberId', { length: 255 }),
			fields: json('fields').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(qr) => ({
			surveyIdIdx: index('surveyId_idx').on(qr.surveyId),
			questionIdIdx: index('questionId_idx').on(qr.questionId),
			userIdIdx: index('userId_idx').on(qr.userId),
			emailListSubscriberIdIdx: index('emailListSubscriberId_idx').on(
				qr.emailListSubscriberId,
			),
			surveySubscriberIdx: index('survey_subscriber_idx').on(
				qr.surveyId,
				qr.emailListSubscriberId,
			),
		}),
	)
}

export function getQuestionResponseRelationsSchema(mysqlTable: MySqlTableFn) {
	const questionResponse = getQuestionResponseSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const contentResource = getContentResourceSchema(mysqlTable)

	return relations(questionResponse, ({ one }) => ({
		user: one(users, {
			fields: [questionResponse.userId],
			references: [users.id],
			relationName: 'questionResponseUser',
		}),
		survey: one(contentResource, {
			fields: [questionResponse.surveyId],
			references: [contentResource.id],
			relationName: 'questionResponseSurvey',
		}),
		question: one(contentResource, {
			fields: [questionResponse.questionId],
			references: [contentResource.id],
			relationName: 'questionResponseQuestion',
		}),
	}))
}
