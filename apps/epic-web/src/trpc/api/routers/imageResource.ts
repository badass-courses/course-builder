import { getAllImageResources } from '@/lib/image-resource-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'

export const imageResourceRouter = createTRPCRouter({
	getAll: publicProcedure.query(async () => {
		return getAllImageResources()
	}),
})
