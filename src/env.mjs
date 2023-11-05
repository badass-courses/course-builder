import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL"
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url()
    ),
    OPENAI_API_KEY: z.string(),
    SANITY_STUDIO_PROJECT_ID: z.string(),
    SANITY_STUDIO_DATASET: z.string(),
    SANITY_STUDIO_API_VERSION: z.string(),
    SANITY_API_TOKEN: z.string(),
    INNGEST_EVENT_KEY: z.string(),
    INNGEST_SIGNING_KEY: z.string(),
    MUX_SECRET_KEY: z.string(),
    MUX_ACCESS_TOKEN_ID: z.string(),
    OPENAI_MODEL_ID: z.string(),
    OPENAI_EMBEDDINGS_MODEL: z.string(),
    PINECONE_API_KEY: z.string(),
    PINECONE_ENVIRONMENT: z.string(),
    PINECONE_INDEX: z.string(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    DEEPGRAM_API_KEY: z.string(),
    AWS_VIDEO_UPLOAD_BUCKET: z.string(),
    AWS_VIDEO_UPLOAD_REGION: z.string(),
    AWS_VIDEO_UPLOAD_ACCESS_KEY_ID: z.string(),
    AWS_VIDEO_UPLOAD_SECRET_ACCESS_KEY: z.string(),
    UPLOADTHING_URL: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_PARTYKIT_ROOM_NAME: z.string(),
    NEXT_PUBLIC_PARTY_KIT_URL: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID,
    SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET,
    SANITY_STUDIO_API_VERSION: process.env.SANITY_STUDIO_API_VERSION,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    NEXT_PUBLIC_PARTYKIT_ROOM_NAME: process.env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
    NEXT_PUBLIC_PARTY_KIT_URL: process.env.NEXT_PUBLIC_PARTY_KIT_URL,
    MUX_ACCESS_TOKEN_ID: process.env.MUX_ACCESS_TOKEN_ID,
    MUX_SECRET_KEY: process.env.MUX_SECRET_KEY,
    OPENAI_MODEL_ID: process.env.OPENAI_MODEL_ID,
    OPENAI_EMBEDDINGS_MODEL: process.env.OPENAI_EMBEDDINGS_MODEL,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
    PINECONE_INDEX: process.env.PINECONE_INDEX,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    AWS_VIDEO_UPLOAD_BUCKET: process.env.AWS_VIDEO_UPLOAD_BUCKET,
    AWS_VIDEO_UPLOAD_REGION: process.env.AWS_VIDEO_UPLOAD_REGION,
    AWS_VIDEO_UPLOAD_ACCESS_KEY_ID: process.env.AWS_VIDEO_UPLOAD_ACCESS_KEY_ID,
    AWS_VIDEO_UPLOAD_SECRET_ACCESS_KEY: process.env.AWS_VIDEO_UPLOAD_SECRET_ACCESS_KEY,
    UPLOADTHING_URL: process.env.UPLOADTHING_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
