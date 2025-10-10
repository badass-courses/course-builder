'use client'

import * as React from 'react'
import LayoutClient from '@/components/layout-client'
import toast from 'react-hot-toast'

export default function CheckYourEmailTemplate() {
	React.useEffect(() => {
		toast.success('Check your email', {
			icon: '✉️',
		})
	}, [])

	return (
		<LayoutClient withContainer>
			<main data-check-your-email="">
				<div data-container="">
					<h1 data-title="">Check your email</h1>
					<p data-message="">
						A login link will be sent to your email! Use it and you&apos;ll be
						able to access your account.
					</p>
				</div>
			</main>
		</LayoutClient>
	)
}
