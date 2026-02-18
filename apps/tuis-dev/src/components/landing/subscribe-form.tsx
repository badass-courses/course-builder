'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCsrf } from '@/app/(user)/login/actions'
import { subscribeToNewsletter } from '@/lib/subscribe-actions'

export function SubscribeForm() {
	const router = useRouter()
	const nameRef = useRef<HTMLInputElement>(null)
	const emailRef = useRef<HTMLInputElement>(null)
	const formRef = useRef<HTMLFormElement>(null)
	const [status, setStatus] = useState<
		'idle' | 'submitting' | 'error'
	>('idle')
	const [errorMsg, setErrorMsg] = useState('')

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		const tag = (e.target as HTMLElement)?.tagName
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

		switch (e.key.toLowerCase()) {
			case 'n':
				e.preventDefault()
				nameRef.current?.focus()
				break
			case 'e':
				e.preventDefault()
				emailRef.current?.focus()
				break
			case 's':
				e.preventDefault()
				formRef.current?.requestSubmit()
				break
		}
	}, [])

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleKeyDown])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (status === 'submitting') return

		const email = emailRef.current?.value?.trim()
		const firstName = nameRef.current?.value?.trim()

		if (!email) return

		setStatus('submitting')
		setErrorMsg('')

		const result = await subscribeToNewsletter({ email, firstName })

		if (result.success) {
			const callbackUrl = `/confirmed?email=${encodeURIComponent(result.email)}`
			const csrfToken = await getCsrf()

			// POST directly to NextAuth's postmark signin endpoint
			// so we can pass custom form fields (subscribeConfirm)
			const params = new URLSearchParams()
			params.append('email', result.email)
			params.append('callbackUrl', callbackUrl)
			params.append('csrfToken', csrfToken)
			params.append('subscribeConfirm', 'true')
			if (firstName) params.append('firstName', firstName)

			const res = await fetch('/api/auth/signin/postmark', {
				method: 'POST',
				body: params,
				credentials: 'include',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			})

			if (!res.ok) {
				setErrorMsg('Failed to send confirmation email. Please try again.')
				setStatus('error')
				return
			}

			router.push(`/confirm?email=${encodeURIComponent(result.email)}`)
		} else {
			setErrorMsg(result.error)
			setStatus('error')
		}
	}

	return (
		<form
			ref={formRef}
			onSubmit={handleSubmit}
			className="font-pixel rounded-xl bg-black/20 p-1.5"
		>
			<div className="grid grid-cols-2 overflow-hidden rounded-t-lg border border-white/10">
				<label className="relative w-full">
					<span
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1 text-[10px] text-white/40"
					>
						[N]
					</span>
					<input
						ref={nameRef}
						type="text"
						placeholder="Name"
						disabled={status === 'submitting'}
						className="w-full border-r border-white/10 bg-white/5 p-3 pt-5 outline-none transition-colors focus:border-[#C0FFBD]/50 focus-visible:border-transparent focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50"
					/>
				</label>
				<label className="relative w-full">
					<span
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1 text-[10px] text-white/40"
					>
						[E]
					</span>
					<input
						ref={emailRef}
						type="email"
						placeholder="Email"
						required
						disabled={status === 'submitting'}
						className="w-full bg-white/5 p-3 pt-5 outline-none transition-colors focus:border-[#C0FFBD]/50 focus-visible:border-transparent focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50"
					/>
				</label>
			</div>
			<button
				type="submit"
				disabled={status === 'submitting'}
				className="font-pixel group w-full cursor-pointer rounded-b-lg bg-[#C0FFBD] py-3 text-black transition-colors hover:bg-[#d4ffcf] disabled:opacity-50"
			>
				{status === 'submitting' ? (
					'Subscribing...'
				) : (
					<>
						<span aria-hidden="true" className="group-focus-within:underline">
							[S]
						</span>{' '}
						Subscribe
					</>
				)}
			</button>
			{status === 'error' && errorMsg && (
				<p className="mt-1 text-center text-xs text-red-400">{errorMsg}</p>
			)}
		</form>
	)
}
