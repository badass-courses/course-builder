import { relations, sql } from 'drizzle-orm'
import {
	index,
	MySqlTableFn,
	text,
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
			answer: text('answer').notNull(),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			})
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			})
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
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
			createdAtIdx: index('createdAt_idx').on(qr.createdAt),
			surveyUserIdx: index('survey_user_idx').on(qr.surveyId, qr.userId),
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
