import { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { communicationPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

export const metadata: Metadata = {
  title: 'Unsubscribed',
  description: 'Unsubscribed',
  robots: 'noindex, nofollow',
}

type UnsubscribedProps = {
  searchParams: { [key: string]: string | string[] | undefined }
}

const Unsubscribed = async ({ searchParams }: UnsubscribedProps) => {
  headers()
  const userId = searchParams.userId

  if (!userId) {
    redirect('/')
  }

  const preferenceType = await db.query.communicationPreferenceTypes.findFirst({
    where: (cpt, { eq }) => eq(cpt.name, 'Newsletter'),
  })

  if (!preferenceType) {
    redirect('/')
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId as string),
    with: {
      communicationPreferences: {
        where: (communicationPreferences, { eq }) =>
          eq(communicationPreferences.preferenceTypeId, preferenceType.id),
        with: {
          channel: true,
          preferenceType: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/')
  }

  const preference = user.communicationPreferences.find(
    (cp) => cp.preferenceTypeId === preferenceType.id,
  )

  if (!preference) {
    const preferenceChannel = await db.query.communicationChannel.findFirst({
      where: (cc, { eq }) => eq(cc.name, 'Email'),
    })

    if (!preferenceChannel) {
      redirect('/')
    }

    await db.insert(communicationPreferences).values({
      id: nanoid(),
      userId: user.id,
      preferenceTypeId: preferenceType.id,
      channelId: preferenceChannel.id,
      active: false,
      updatedAt: new Date(),
      preferenceLevel: 'low',
      optOutAt: new Date(),
      createdAt: new Date(),
    })
  } else {
    await db
      .update(communicationPreferences)
      .set({
        active: false,
        updatedAt: new Date(),
        optOutAt: new Date(),
      })
      .where(eq(communicationPreferences.id, preference.id))
  }

  return (
    <div className="flex min-h-[calc(100vh-96px)] flex-col p-0">
      <div className="flex flex-grow flex-col items-center justify-center p-5 pb-16 text-center sm:pb-0">
        <div className="font-heading max-w-xl pt-4 text-3xl">
          You&apos;ve been removed from the email list and won&apos;t receive
          any more emails.
        </div>
      </div>
    </div>
  )
}

export default Unsubscribed
