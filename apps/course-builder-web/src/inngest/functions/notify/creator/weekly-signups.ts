import {inngest} from '@/inngest/inngest.server'
import {sendAnEmail} from '@/utils/send-an-email'
import {sanityQuery} from '@/server/sanity.server'
import {db} from '@/server/db'
import {users} from '@/server/db/schema'
import {sql} from 'drizzle-orm'
import {Liquid} from 'liquidjs'
import WeeklySignups from '@/emails/weekly-signups'

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
        .groupBy(users.id)
      return result[0]?.count ?? 0
    })

    const parsedEmailBody = await step.run(`parse email`, async () => {
      const engine = new Liquid()
      return engine.parseAndRender(email.body, {newUserCount})
    })

    const sendResponse = await step.run('send the email', async () => {
      return await sendAnEmail({
        Component: WeeklySignups,
        componentProps: {
          user: event.user,
          body: parsedEmailBody,
        },
        Subject: email.subject,
        To: `joel@badass.dev`,
      })
    })

    return {sendResponse, email, parsedEmailBody, user: event.user}
  },
)
