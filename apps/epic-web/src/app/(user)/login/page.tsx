'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const router = useRouter()

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsSubmitting(true)

		const formData = new FormData(e.currentTarget)
		const email = formData.get('email') as string

		await signIn('email', { email, redirect: false })
		router.push('/check-your-email')
	}

	return (
		<div
			className="flex min-h-screen flex-col items-center justify-center"
			data-login-template
		>
			<div className="w-full max-w-md">
				<h1 className="text-center text-3xl font-bold" data-title>
					Sign in to Epic Web
				</h1>

				<form onSubmit={handleSubmit} data-form className="space-y-4">
					<div>
						<label htmlFor="email" className="block text-sm font-medium">
							Email address
						</label>
						<div
							className="relative mt-1 rounded-md shadow-sm"
							data-input-container
						>
							<div
								className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
								data-icon
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 text-gray-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
									<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
								</svg>
							</div>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								placeholder="you@example.com"
								data-input
							/>
						</div>
					</div>

					<button
						type="submit"
						className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
						disabled={isSubmitting}
						data-button
					>
						{isSubmitting ? 'Signing in...' : 'Sign in with Email'}
					</button>
				</form>

				<div className="mt-6 text-center text-sm text-gray-500" data-separator>
					or continue with
				</div>

				<div className="mt-6" data-providers-container>
					<button
						onClick={() => signIn('github', { callbackUrl: '/' })}
						className="flex w-full items-center justify-center rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
						data-button
					>
						<svg
							className="mr-2 h-5 w-5"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
								clipRule="evenodd"
							/>
						</svg>
						Sign in with GitHub
					</button>
				</div>
			</div>
		</div>
	)
}
