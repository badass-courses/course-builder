'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
	setSubscriberCookie,
	subscribeToNewsletter,
} from '@/lib/subscribe-actions'

export function SubscribeForm() {
	const nameRef = useRef<HTMLInputElement>(null)
	const emailRef = useRef<HTMLInputElement>(null)
	const formRef = useRef<HTMLFormElement>(null)
	const [status, setStatus] = useState<
		'idle' | 'submitting' | 'success' | 'error'
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
			await setSubscriberCookie(result.email)
			setStatus('success')
		} else {
			setErrorMsg(result.error)
			setStatus('error')
		}
	}

	if (status === 'success') {
		return (
			<div className="bg-black/20 p-1.5 font-mono">
				<div className="flex items-center justify-center border border-[#C0FFBD]/30 bg-[#C0FFBD]/5 p-6 text-center text-sm text-[#C0FFBD]">
					&#10003; You're in.
					{/* Check your inbox. */}
				</div>
			</div>
		)
	}

	return (
		<form
			ref={formRef}
			onSubmit={handleSubmit}
			className="rounded-xl bg-black/20 p-1.5 font-mono"
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
						className="w-full border-r border-white/10 bg-white/5 p-3 pt-5 outline-none transition-colors focus:border-[#C0FFBD]/50 disabled:opacity-50"
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
						className="w-full bg-white/5 p-3 pt-5 outline-none transition-colors focus:border-[#C0FFBD]/50 disabled:opacity-50"
					/>
				</label>
			</div>
			<button
				type="submit"
				disabled={status === 'submitting'}
				className="w-full cursor-pointer rounded-b-lg bg-[#C0FFBD] py-3 font-mono text-black transition-colors hover:bg-[#d4ffcf] disabled:opacity-50"
			>
				{status === 'submitting' ? (
					'Subscribing...'
				) : (
					<>
						<span aria-hidden="true">[S]</span> Subscribe
					</>
				)}
			</button>
			{status === 'error' && errorMsg && (
				<p className="mt-1 text-center text-xs text-red-400">{errorMsg}</p>
			)}
		</form>
	)
}
