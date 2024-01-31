export const useCdn = false;

/**
 * As this file is reused in several other files, try to keep it lean and small.
 * Importing other npm packages here could lead to needlessly increasing the client bundle size, or end up in a server-only function that don't need it.
 */

export const dataset = assertValue(
  process.env.SANITY_STUDIO_DATASET,
  "Missing environment variable: SANITY_STUDIO_DATASET",
);

export const projectId = assertValue(
  process.env.SANITY_STUDIO_PROJECT_ID,
  "Missing environment variable: SANITY_STUDIO_PROJECT_ID",
);

export const readToken = process.env.SANITY_API_READ_TOKEN || "";

// see https://www.sanity.io/docs/api-versioning for how versioning works
export const apiVersion = process.env.SANITY_STUDIO_VERSION || "2023-06-21";

// This is the document id used for the preview secret that's stored in your dataset.
// The secret protects against unauthorized access to your draft content and have a lifetime of 60 minutes, to protect against bruteforcing.
export const previewSecretId: `${string}.${string}` = "preview.secret";

// Used to generate URLs for previewing your content
export const DRAFT_MODE_ROUTE = "/api/draft";

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage);
  }

  return v;
}
