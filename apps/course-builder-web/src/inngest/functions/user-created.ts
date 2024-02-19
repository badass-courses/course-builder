import BasicEmail from '@/emails/basic-email'
import { USER_CREATED_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { db } from '@/server/db'
import { communicationPreferences } from '@/server/db/schema'
import { sanityQuery } from '@/server/sanity.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { NonRetriableError } from 'inngest'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

export const userCreated = inngest.createFunction(
  {
    id: `user created`,
    name: 'User Created',
    idempotency: 'event.user.email',
  },
  {
    event: USER_CREATED_EVENT,
  },
  async ({ event, step }) => {
    const email = await step.run(`load email`, async () => {
      return await sanityQuery<{
        _id: string
        subject: string
        body: string
        previewText?: string
      }>(`*[_type == "courseBuilderEmail" && slug.current == "welcome-email"][0]`)
    })

    const { preferenceType, preferenceChannel } = await step.run('load the preference type and channel', async () => {
      const preferenceType = await db.query.communicationPreferenceTypes.findFirst({
        where: (cpt, { eq }) => eq(cpt.name, 'Newsletter'),
      })
      const preferenceChannel = await db.query.communicationChannel.findFirst({
        where: (cc, { eq }) => eq(cc.name, 'Email'),
      })
      return { preferenceType, preferenceChannel }
    })

    if (!preferenceType || !preferenceChannel) {
      throw new NonRetriableError('Preference type or channel not found')
    }

    await step.run('create the user preference', async () => {
      await db.insert(communicationPreferences).values({
        id: nanoid(),
        userId: event.user.id,
        preferenceTypeId: preferenceType.id,
        channelId: preferenceChannel.id,
        active: true,
        updatedAt: new Date(),
        optInAt: new Date(),
        createdAt: new Date(),
      })
    })

    const sendResponse = await step.run('send the email', async () => {
      return await sendAnEmail({
        Component: BasicEmail,
        componentProps: {
          body: email.body,
        },
        Subject: email.subject,
        To: event.user.email,
        type: 'broadcast',
      })
    })

    return { sendResponse, email, user: event.user }
  },
)
