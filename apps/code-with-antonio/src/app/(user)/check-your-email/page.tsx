'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import LayoutClient from '@/components/layout-client'
import toast from 'react-hot-toast'

import { Card, CardContent } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

function CheckYourEmailContent() {
	const searchParams = useSearchParams()
	const title = searchParams.get('title')
	const coverImage = searchParams.get('coverImage')
	const email = searchParams.get('email')

	React.useEffect(() => {
		toast.success('Check your email', {
			icon: '✉️',
		})
	}, [])

	return (
		<div className="flex min-h-[calc(100svh-77px)] flex-col items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-md">
				<div className="flex flex-col">
					<Card className="overflow-hidden p-0">
						<CardContent className="flex flex-col p-0">
							<div className="flex flex-col items-center justify-center gap-3 p-6 text-center md:p-8 lg:p-12">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="text-muted-foreground size-10"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="m2 6 6.913 3.917c2.549 1.444 3.625 1.444 6.174 0L22 6"
									/>
									<path
										stroke="currentColor"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="M2.016 13.476c.065 3.065.098 4.598 1.229 5.733 1.131 1.136 2.705 1.175 5.854 1.254 1.94.05 3.862.05 5.802 0 3.149-.079 4.723-.118 5.854-1.254 1.131-1.135 1.164-2.668 1.23-5.733.02-.986.02-1.966 0-2.952-.066-3.065-.099-4.598-1.23-5.733-1.131-1.136-2.705-1.175-5.854-1.254a115.11 115.11 0 0 0-5.802 0c-3.149.079-4.723.118-5.854 1.254-1.131 1.135-1.164 2.668-1.23 5.733a69.066 69.066 0 0 0 0 2.952Z"
									/>
								</svg>

								<h1 className="text-2xl font-semibold">Check your email</h1>
								<p className="text-muted-foreground">
									{title ? (
										<>
											A login link has been sent to{' '}
											{email ? <strong>{email}</strong> : 'your email'} to
											access <strong>{title}</strong>. Click the link to
											continue.
										</>
									) : (
										<>
											A login link has been sent to{' '}
											{email ? <strong>{email}</strong> : 'your email'}. Use
											it and you&apos;ll be able to access your account.
										</>
									)}
								</p>
							</div>
							<div
								className={cn(
									'relative hidden items-center justify-center md:flex',
									{
										'aspect-video': coverImage,
									},
								)}
							>
								{coverImage ? (
									<CldImage
										src={coverImage}
										alt={title || 'Cover image'}
										fill
										className="object-contain"
									/>
								) : (
									<CldImage
										src="https://res.cloudinary.com/dezn0ffbx/image/upload/v1770297352/antonio-opening-mail_2x_t12wcj.png"
										alt="Antonio opening mail"
										width={404 / 1.5}
										height={568 / 1.5}
										className="px-10"
									/>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}

export default function CheckYourEmailPage() {
	return (
		<LayoutClient>
			<Suspense fallback={null}>
				<CheckYourEmailContent />
			</Suspense>
		</LayoutClient>
	)
}
