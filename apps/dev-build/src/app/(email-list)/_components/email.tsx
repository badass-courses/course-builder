'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'

export const Email: React.FC = () => {
	const searchParams = useSearchParams()
	const email = searchParams.has('email')
		? searchParams.get('email')
		: 'your email address'

	return <strong>{email}</strong>
}
