'use client'

import * as React from 'react'
import { HeroIllustration } from '@/components/brand/svgs'
import LayoutClient from '@/components/layout-client'
import toast from 'react-hot-toast'

import { Card, CardContent } from '@coursebuilder/ui'

export default function CheckYourEmailTemplate() {
	React.useEffect(() => {
		toast.success('Check your email', {
			icon: '✉️',
		})
	}, [])

	return (
		<LayoutClient>
			<div className="bg-muted flex min-h-[calc(100svh-77px)] flex-col items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-sm md:max-w-4xl">
					<div className="flex flex-col">
						<Card className="overflow-hidden p-0">
							<CardContent className="grid p-0 md:grid-cols-2">
								<div className="flex flex-col items-center justify-center gap-3 p-6 text-center md:p-8">
									<h1 className="text-2xl font-semibold">Check your email</h1>
									<p className="text-muted-foreground">
										A login link will be sent to your email! Use it and
										you&apos;ll be able to access your account.
									</p>
								</div>
								<div className="bg-primary relative hidden p-10 md:block">
									<HeroIllustration />
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</LayoutClient>
	)
}
