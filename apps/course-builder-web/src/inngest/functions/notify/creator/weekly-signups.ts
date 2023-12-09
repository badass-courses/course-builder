import {inngest} from '@/inngest/inngest.server'
import {sendAnEmail} from '@/utils/send-an-email'
import {sanityQuery} from '@/server/sanity.server'
import {db} from '@/server/db'
import {users} from '@/server/db/schema'
import {gt, sql} from 'drizzle-orm'
import {Liquid} from 'liquidjs'
import WeeklySignups from '@/emails/weekly-signups'
import BasicEmail, {BasicEmailProps} from '@/emails/basic-email'

export const weeklySignupDigest = inngest.createFunction(
  {id: `weekly signup digest`, name: 'Weekly Signup Digest'},
  {cron: 'TZ=US/Pacific 0 13 * * MON'},
  async ({event, step}) => {
    const email = await step.run(`load email`, async () => {
      return await sanityQuery<{
        _id: string
        subject: string
        body: string
        previewText?: string
      }>(
        `*[_type == "courseBuilderEmail" && slug.current == "weekly-signups"][0]`,
      )
    })

    const newUserCount = await step.run(`load new user count`, async () => {
      const result = await db
        .select({
          id: users.id,
          count: sql<number>`cast(count(${users.id}) as UNSIGNED)`,
        })
        .from(users)
        .where(gt(users.createdAt, sql`DATE_SUB(NOW(), INTERVAL 7 DAY)`))
        .groupBy(users.id)

      return result[0]?.count ?? 0
    })

    const parsedEmailBody: string = await step.run(
      `parse email body`,
      async () => {
        try {
          const engine = new Liquid()
          return engine.parseAndRender(email.body, {
            user: event.user,
            newUserCount,
          })
        } catch (e: any) {
          console.error(e.message)
          return email.body
        }
      },
    )

    const parsedEmailSubject: string = await step.run(
      `parse email subject`,
      async () => {
        try {
          const engine = new Liquid()
          return engine.parseAndRender(email.subject, {
            user: event.user,
            newUserCount,
          })
        } catch (e) {
          return email.subject
        }
      },
    )

    const sendResponse = await step.run('send the email', async () => {
      return await sendAnEmail<BasicEmailProps>({
        Component: BasicEmail,
        componentProps: {
          body: parsedEmailBody,
          messageType: 'transactional',
        },
        Subject: parsedEmailSubject,
        To: `joel@badass.dev`,
      })
    })

    return {
      sendResponse,
      email,
      parsedEmailBody,
      parsedEmailSubject,
      user: event.user,
    }
  },
)
