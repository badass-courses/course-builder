import { Suspense } from 'react'
import Image from 'next/image'
import { Metadata } from 'next/types'
import { Email } from '@/app/(email-list)/_components/email'
import { Signature } from '@/app/(email-list)/_components/signature'
import LayoutClient from '@/components/layout-client'

export const metadata: Metadata = {
	title: 'Confirm your subscription',
}

export default async function ConfirmSubscriptionPage() {
	return (
		<LayoutClient withContainer>
			<main className="min-h-(--pane-layout-height) container mx-auto flex w-full grow flex-col items-center justify-center px-5 py-24">
				<div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center font-light">
					<h1 className="font-text font-heading mx-auto w-full max-w-lg py-8 text-3xl font-extrabold sm:text-5xl">
						Confirm your email address
					</h1>
					<div className="prose dark:prose-invert sm:prose-lg prose-p:text-balance mx-auto leading-relaxed opacity-80">
						<p>
							We sent an email to{' '}
							<Suspense>
								<Email />
							</Suspense>{' '}
							with a confirmation link. Click the link to finish your
							subscription.
						</p>
						<p>
							Didn&apos;t get an email? Check your spam folder or other filters
							and add <strong>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</strong>{' '}
							to your contacts.
						</p>
						<p>
							Thanks, <br />
							<Signature />
						</p>
					</div>
				</div>
				{/* <Image
				src={require('../../../../public/assets/bg-text-1@2x.jpg')}
				fill
				alt=""
				aria-hidden="true"
				className="-z-10 object-cover object-center md:object-contain"
			/> */}
			</main>
		</LayoutClient>
	)
}
