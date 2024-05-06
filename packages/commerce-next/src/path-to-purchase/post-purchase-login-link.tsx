import * as React from 'react'
import { MailIcon } from 'lucide-react'
import Balancer from 'react-wrap-balancer'

export const LoginLink: React.FC<{ email: string }> = ({ email }) => {
	return (
		<div className="bg-card relative mx-auto flex w-full items-center justify-between gap-5 overflow-hidden rounded-xl border border-gray-700/30 p-7 shadow-2xl sm:p-12">
			<div className="relative z-10">
				<p className="bg-primary/20 text-primary inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase sm:text-sm">
					Final step
				</p>
				<h2 className="mx-auto text-balance py-5 text-xl font-bold sm:text-2xl lg:text-3xl">
					Please check your inbox for a <strong>login link</strong> that just
					got sent.
				</h2>
				<div className=" mb-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-gray-900 shadow-lg shadow-gray-600/20">
					<MailIcon className="h-5 w-5 flex-shrink-0 text-slate-900/40" />{' '}
					<strong className="inline-block break-all font-semibold">
						Email sent to: {email}
					</strong>
				</div>
				<p className="mx-auto pt-5 font-medium leading-relaxed sm:text-base sm:leading-relaxed">
					<Balancer>
						As a final step to access the course you need to check your inbox (
						<strong>{email}</strong>) where you will find an email from{' '}
						<strong>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</strong> with a link
						to access your purchase and start learning.
					</Balancer>
				</p>
			</div>
		</div>
	)
}
