'use client'

import React from 'react'
import { type Post } from '@/lib/posts'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

/**
 * Error fallback component for MDX compilation errors
 */
function MDXErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0">
					<svg
						className="h-5 w-5 text-red-400"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
				<div className="flex-1">
					<h3 className="text-sm font-medium text-red-800 dark:text-red-200">
						Content Error
					</h3>
					<div className="mt-2 text-sm text-red-700 dark:text-red-300">
						<p>
							There's an issue with the content formatting. This usually happens
							when there are unescaped curly braces or invalid MDX syntax.
						</p>
						{process.env.NODE_ENV === 'development' && (
							<details className="mt-3">
								<summary className="cursor-pointer font-medium">
									Error Details (Development)
								</summary>
								<pre className="mt-2 whitespace-pre-wrap text-xs">
									{error.message}
								</pre>
							</details>
						)}
					</div>
					<div className="mt-4">
						<button
							onClick={resetErrorBoundary}
							className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

/**
 * Client-side error boundary wrapper for PostBody component
 * Handles MDX compilation errors with proper logging
 */
export function PostBodyErrorBoundary({
	post,
	children,
}: {
	post: Post | null
	children: React.ReactNode
}) {
	return (
		<ErrorBoundary
			FallbackComponent={MDXErrorFallback}
			resetKeys={[post?.fields?.body]}
			onError={(error, errorInfo) => {
				// Log the error for debugging
				console.error('MDX compilation error:', error, errorInfo)
			}}
		>
			{children}
		</ErrorBoundary>
	)
}
