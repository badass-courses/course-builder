import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		STRIPE_SECRET_TOKEN: z.string().optional(),
		STRIPE_WEBHOOK_SECRET: z.string().optional(),
		COURSEBUILDER_URL: z.preprocess(
			// This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
			// Since NextAuth.js automatically uses the VERCEL_URL if present.
			(str) =>
				process.env.VERCEL_PROJECT_PRODUCTION_URL
					? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
					: str,
			// VERCEL_URL doesn't include `https` so it cant be validated as a URL
			process.env.VERCEL_PROJECT_PRODUCTION_URL ? z.string() : z.string(),
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
		REPLICATE_API_KEY: z.string().optional(),
		ANTHROPIC_API_KEY: z.string().optional(),
		INNGEST_EVENT_KEY: z.string(),
		INNGEST_SIGNING_KEY: z.string(),
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
		RESEND_API_KEY: z.string().optional(),
		AWS_REGION: z.string().optional(),
		AWS_ACCESS_KEY_ID: z.string().optional(),
		AWS_SECRET_ACCESS_KEY: z.string().optional(),
		AWS_BUCKET_NAME: z.string().optional(),
		CONVERTKIT_API_SECRET: z.string().optional(),
		CONVERTKIT_API_KEY: z.string().optional(),
		CONVERTKIT_SIGNUP_FORM: z.union([z.string(), z.number()]).optional(),
		EMAIL_SERVER_HOST: z.string().optional(),
		EMAIL_SERVER_PORT: z.coerce.number().optional(),
		POSTMARK_KEY: z.string().optional(),
		SLACK_TOKEN: z.string().optional(),
		SLACK_DEFAULT_CHANNEL_ID: z.string().optional(),
		DISCORD_CLIENT_SECRET: z.string().optional(),
		DISCORD_BOT_TOKEN: z.string().optional(),
		DISCORD_GUILD_ID: z.string().optional(),
		DISCORD_MEMBER_ROLE_ID: z.string().optional(),
		DISCORD_SUBSCRIBER_ROLE_ID: z.string().optional(),
		DISCORD_PURCHASER_ROLE_ID: z.string().optional(),
		DISCORD_CLIENT_ID: z.string().optional(),
		CLOUDINARY_API_KEY: z.string(),
		CLOUDINARY_API_SECRET: z.string(),
		PINECONE_API_KEY: z.string().optional(),
		AXIOM_TOKEN: z.string().optional(),
		DROPBOX_ACCESS_TOKEN: z.string().optional(),
		DROPBOX_TEAM_MEMBER_ID: z.string().optional(),
		DROPBOX_TEAM_NAMESPACE_ID: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_APP_NAME: z.string(),
		NEXT_PUBLIC_GOOGLE_ANALYTICS: z.string().optional(),
		NEXT_PUBLIC_PARTYKIT_ROOM_NAME: z.string(),
		NEXT_PUBLIC_PARTY_KIT_URL: z.string(),
		NEXT_PUBLIC_URL: z.string(),
		NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string(),
		NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string(),
		NEXT_PUBLIC_AMPLITUDE_API_KEY: z.string().optional(),
		NEXT_PUBLIC_SUPPORT_EMAIL: z.string(),
		NEXT_PUBLIC_SITE_TITLE: z.string(),
		NEXT_PUBLIC_DISCORD_INVITE_URL: z.string().optional(),
		NEXT_PUBLIC_AXIOM_DATASET: z.string().optional(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		STRIPE_SECRET_TOKEN: process.env.STRIPE_SECRET_TOKEN,
		NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
		COURSEBUILDER_URL: process.env.COURSEBUILDER_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		REPLICATE_API_KEY: process.env.REPLICATE_API_KEY,
		ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		OPENAI_MODEL_ID: process.env.OPENAI_MODEL_ID,
		INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
		INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
		NEXT_PUBLIC_PARTYKIT_ROOM_NAME: process.env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
		NEXT_PUBLIC_PARTY_KIT_URL: process.env.NEXT_PUBLIC_PARTY_KIT_URL,
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
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		AWS_REGION: process.env.AWS_REGION,
		AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
		AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
		CONVERTKIT_API_SECRET: process.env.CONVERTKIT_API_SECRET,
		CONVERTKIT_API_KEY: process.env.CONVERTKIT_API_KEY,
		CONVERTKIT_SIGNUP_FORM: process.env.CONVERTKIT_SIGNUP_FORM,
		NEXT_PUBLIC_GOOGLE_ANALYTICS: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS,
		NEXT_PUBLIC_AMPLITUDE_API_KEY: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
		EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
		EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
		POSTMARK_KEY: process.env.POSTMARK_KEY,
		NEXT_PUBLIC_SITE_TITLE: process.env.NEXT_PUBLIC_SITE_TITLE,
		NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
		SLACK_TOKEN: process.env.SLACK_TOKEN,
		SLACK_DEFAULT_CHANNEL_ID: process.env.SLACK_DEFAULT_CHANNEL_ID,
		NEXT_PUBLIC_DISCORD_INVITE_URL: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL,
		DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
		DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
		DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
		DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
		DISCORD_MEMBER_ROLE_ID: process.env.DISCORD_MEMBER_ROLE_ID,
		DISCORD_SUBSCRIBER_ROLE_ID: process.env.DISCORD_SUBSCRIBER_ROLE_ID,
		DISCORD_PURCHASER_ROLE_ID: process.env.DISCORD_PURCHASER_ROLE_ID,
		CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
		CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
		PINECONE_API_KEY: process.env.PINECONE_API_KEY,
		AXIOM_TOKEN: process.env.AXIOM_TOKEN,
		NEXT_PUBLIC_AXIOM_DATASET: process.env.NEXT_PUBLIC_AXIOM_DATASET,
		DROPBOX_ACCESS_TOKEN: process.env.DROPBOX_ACCESS_TOKEN,
		DROPBOX_TEAM_MEMBER_ID: process.env.DROPBOX_TEAM_MEMBER_ID,
		DROPBOX_TEAM_NAMESPACE_ID: process.env.DROPBOX_TEAM_NAMESPACE_ID,
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
