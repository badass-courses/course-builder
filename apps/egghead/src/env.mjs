import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		COURSEBUILDER_URL: z.preprocess(
			// This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
			// Since NextAuth.js automatically uses the VERCEL_URL if present.
			(str) =>
				process.env.COURSEBUILDER_URL
					? process.env.COURSEBUILDER_URL
					: process.env.VERCEL_URL
						? `https://${process.env.VERCEL_URL}`
						: str,
			// VERCEL_URL doesn't include `https` so it cant be validated as a URL
			process.env.VERCEL ? z.string() : z.string(),
		),
		DATABASE_URL: z
			.string()
			.url()
			.refine(
				(str) => !str.includes('YOUR_MYSQL_URL_HERE'),
				'You forgot to change the default URL',
			),
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		NEXTAUTH_SECRET:
			process.env.NODE_ENV === 'production'
				? z.string()
				: z.string().optional(),
		NEXTAUTH_URL: z.preprocess(
			// This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
			// Since NextAuth.js automatically uses the VERCEL_URL if present.
			(str) =>
				process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : str,
			// VERCEL_URL doesn't include `https` so it cant be validated as a URL
			process.env.VERCEL ? z.string() : z.string(),
		),
		OPENAI_API_KEY: z.string(),
		INNGEST_EVENT_KEY: z.string(),
		INNGEST_SIGNING_KEY: z.string(),
		INNGEST_APP_NAME: z.string(),
		MUX_SECRET_KEY: z.string(),
		MUX_ACCESS_TOKEN_ID: z.string(),
		OPENAI_MODEL_ID: z.string(),
		UPSTASH_REDIS_REST_URL: z.string(),
		UPSTASH_REDIS_REST_TOKEN: z.string(),
		DEEPGRAM_API_KEY: z.string(),
		UPLOADTHING_URL: z.string(),
		POSTMARK_API_KEY: z.string(),
		POSTMARK_WEBHOOK_SECRET: z.string(),
		GITHUB_CLIENT_ID: z.string().optional(),
		GITHUB_CLIENT_SECRET: z.string().optional(),
		TWITTER_CLIENT_ID: z.string().optional(),
		TWITTER_CLIENT_SECRET: z.string().optional(),
		EMAIL_SERVER_HOST: z.string().optional(),
		EMAIL_SERVER_PORT: z.string().optional(),
		POSTMARK_KEY: z.string().optional(),
		SLACK_TOKEN: z.string().optional(),
		SLACK_DEFAULT_CHANNEL_ID: z.string().optional(),
		EGGHEAD_PUBLIC_URL: z.string().optional(),
		STRIPE_SECRET_TOKEN: z.string(),
		STRIPE_WEBHOOK_SECRET: z.string(),
		GOOG_CALENDAR_IMPERSONATE_USER: z.string().optional(),
		GOOG_CREDENTIALS_JSON: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_APP_NAME: z.string(),
		NEXT_PUBLIC_PARTYKIT_ROOM_NAME: z.string(),
		NEXT_PUBLIC_PARTY_KIT_URL: z.string(),
		NEXT_PUBLIC_URL: z.string(),
		NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string(),
		NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string(),
		NEXT_PUBLIC_SUPPORT_EMAIL: z.string(),
		NEXT_PUBLIC_SUPPORT_PHYSICAL_ADDRESS: z.string(),
		NEXT_PUBLIC_SITE_TITLE: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
		COURSEBUILDER_URL: process.env.COURSEBUILDER_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		OPENAI_MODEL_ID: process.env.OPENAI_MODEL_ID,
		INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
		INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
		INNGEST_APP_NAME: process.env.INNGEST_APP_NAME,
		NEXT_PUBLIC_PARTYKIT_ROOM_NAME: process.env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
		NEXT_PUBLIC_PARTY_KIT_URL: process.env.NEXT_PUBLIC_PARTY_KIT_URL,
		NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
		NEXT_PUBLIC_SUPPORT_PHYSICAL_ADDRESS:
			process.env.NEXT_PUBLIC_SUPPORT_PHYSICAL_ADDRESS,
		MUX_ACCESS_TOKEN_ID: process.env.MUX_ACCESS_TOKEN_ID,
		MUX_SECRET_KEY: process.env.MUX_SECRET_KEY,
		GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
		GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
		DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
		UPLOADTHING_URL: process.env.UPLOADTHING_URL,
		POSTMARK_API_KEY: process.env.POSTMARK_API_KEY,
		NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
		POSTMARK_WEBHOOK_SECRET: process.env.POSTMARK_WEBHOOK_SECRET,
		NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
			process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
		NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:
			process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
		TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
		TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
		UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
		UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
		EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
		EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
		POSTMARK_KEY: process.env.POSTMARK_KEY,
		NEXT_PUBLIC_SITE_TITLE: process.env.NEXT_PUBLIC_SITE_TITLE,
		SLACK_TOKEN: process.env.SLACK_TOKEN,
		SLACK_DEFAULT_CHANNEL_ID: process.env.SLACK_DEFAULT_CHANNEL_ID,
		EGGHEAD_PUBLIC_URL: process.env.EGGHEAD_PUBLIC_URL,
		STRIPE_SECRET_TOKEN: process.env.STRIPE_SECRET_TOKEN,
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		GOOG_CALENDAR_IMPERSONATE_USER: process.env.GOOG_CALENDAR_IMPERSONATE_USER,
		GOOG_CREDENTIALS_JSON: process.env.GOOG_CREDENTIALS_JSON,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
})
