import * as React from 'react'
import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Epic Web Builder',
	description: 'Epic Web Builder for creating content for Epic Web',
}

export default function HomePage() {
	return (
		<main>
			<article className="prose sm:prose-lg dark:prose-invert mx-auto w-full max-w-2xl px-5 py-8 sm:py-16">
				<h1>Epic Web Builder</h1>
				<p>
					Welcome to the Epic Web Builder, a platform designed to create,
					manage, and publish content for Epic Web. This platform supports our
					mission to provide high-quality web development education.
				</p>
				<h2>Key Features</h2>
				<ul>
					<li>Content management for modules, lessons, and sections</li>
					<li>Video processing with automatic transcription</li>
					<li>Real-time collaboration for content creators</li>
					<li>Section-based organization for better content structure</li>
				</ul>
				<h2>Getting Started</h2>
				<p>
					To start creating content, <a href="/login">log in</a> with your
					GitHub account. Once logged in, you'll be able to:
				</p>
				<ul>
					<li>Create and edit content modules</li>
					<li>Upload video lessons with automatic transcription</li>
					<li>Organize content into sections for better learning paths</li>
					<li>Collaborate in real-time with other content creators</li>
				</ul>
				<h2>About Epic Web</h2>
				<p>
					Epic Web is a comprehensive web development course by Kent C. Dodds,
					focusing on modern full-stack development with a focus on React,
					Remix, and related technologies.
				</p>
			</article>
		</main>
	)
}
