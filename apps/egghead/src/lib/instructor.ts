import { z } from 'zod'

// Schema for the minimal instructor data we need
const instructorSchema = z.object({
	id: z.number(),
	slug: z.string(),
	twitter: z.string().optional(),
	website: z.string().url().optional(),
	avatar_480_url: z.string().url().optional(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
})

// Main schema with just the fields we need
const profileSchema = z
	.object({
		id: z.number(),
		email: z.string().email(),
		avatar_480_url: z.string().url().optional(),
		first_name: z.string().optional(),
		last_name: z.string().optional(),
		instructor: instructorSchema.optional(),
	})
	.transform((data) => {
		// Transform the data into the exact shape we need
		return {
			// Person document fields
			...data,
			name: data.instructor
				? `${data.instructor.first_name || ''} ${data.instructor.last_name || ''}`.trim()
				: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
			slug: data.instructor?.slug,
			email: data.email,
			avatar_url: data.instructor?.avatar_480_url || data.avatar_480_url,
			website: data.instructor?.website,
			twitter: data.instructor?.twitter
				? `https://twitter.com/${data.instructor.twitter}`
				: undefined,

			// Collaborator document fields
			instructorId: data.instructor?.id.toString(),
		}
	})

export type InstructorProfile = z.infer<typeof profileSchema>

// Validation helper that returns the transformed data
export const validateProfileForSanity = (data: unknown) => {
	console.dir(data, { depth: null })
	return profileSchema.parse(data)
}

// Example usage:
/* 
const profile = validateProfileForSanity({
  id: 1,
  email: 'joel@egghead.io',
  instructor: {
    id: 3,
    slug: 'joel-hooks',
    first_name: 'Joel',
    last_name: 'Hooks',
    twitter: 'jhooks',
    website: 'http://joelhooks.com',
    avatar_url: 'https://d2eip9sf3oo6c2.cloudfront.net/instructors/avatars/000/000/003/medium/joel_head.jpg'
  }
})
*/
