'use client'

import * as React from 'react'
import toast from 'react-hot-toast'

const CheckYourEmailTemplate: React.FC<{
	image?: React.ReactElement
	title?: string
}> = ({ image, title = 'Check your email' }) => {
	React.useEffect(() => {
		toast.success('Check your email', {
			icon: '✉️',
		})
	}, [])

	return (
		<main data-check-your-email="">
			<div data-container="">
				{image ? image : null}
				<h1 data-title="">{title}</h1>
				<p data-message="">
					A login link will be sent to your email! Use it and you&apos;ll be
					able to access your account.
				</p>
			</div>
		</main>
	)
}

export default CheckYourEmailTemplate
