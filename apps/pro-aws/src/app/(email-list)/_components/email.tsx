'use client'

import { useSearchParams } from 'next/navigation'

export const Email = () => {
	const searchParams = useSearchParams()
	const email = searchParams.get('email') || 'your email address'
	return <>{email}</>
}
