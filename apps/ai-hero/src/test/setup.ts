import { vi } from 'vitest'

// Mock environment variables
vi.mock('@/env.mjs', () => ({
	env: {
		STRIPE_SECRET_TOKEN: 'test_stripe_token',
		STRIPE_WEBHOOK_SECRET: 'test_webhook_secret',
		DATABASE_URL: 'sqlite://test.db',
		OPENAI_API_KEY: 'test_openai_key',
		INNGEST_EVENT_KEY: 'test_inngest_key',
		INNGEST_SIGNING_KEY: 'test_inngest_signing',
		MUX_SECRET_KEY: 'test_mux_secret',
		MUX_ACCESS_TOKEN_ID: 'test_mux_token',
		OPENAI_MODEL_ID: 'test_model_id',
		UPSTASH_REDIS_REST_URL: 'test_redis_url',
		UPSTASH_REDIS_REST_TOKEN: 'test_redis_token',
		DEEPGRAM_API_KEY: 'test_deepgram_key',
		UPLOADTHING_URL: 'test_uploadthing_url',
		POSTMARK_API_KEY: 'test_postmark_key',
		POSTMARK_WEBHOOK_SECRET: 'test_postmark_webhook',
		CONVERTKIT_API_SECRET: 'test_convertkit_secret',
		CONVERTKIT_API_KEY: 'test_convertkit_key',
		CONVERTKIT_SIGNUP_FORM: '123456',
		CLOUDINARY_API_KEY: 'test_cloudinary_key',
		CLOUDINARY_API_SECRET: 'test_cloudinary_secret',
		NEXT_PUBLIC_APP_NAME: 'Test App',
		NEXT_PUBLIC_PARTYKIT_ROOM_NAME: 'test_room',
		NEXT_PUBLIC_PARTY_KIT_URL: 'test_partykit_url',
		NEXT_PUBLIC_URL: 'http://localhost:3000',
		NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'test_cloud',
		NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: 'test_preset',
		NEXT_PUBLIC_SUPPORT_EMAIL: 'test@example.com',
		NEXT_PUBLIC_SITE_TITLE: 'Test Site',
	},
}))