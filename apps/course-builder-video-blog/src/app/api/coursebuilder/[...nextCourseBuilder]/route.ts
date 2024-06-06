import {
	GET as cbGet,
	POST as cbPost,
} from '@/coursebuilder/course-builder-config'
import { withSkill } from '@/server/with-skill'

export const POST = withSkill(cbPost)
export const GET = withSkill(cbGet)
