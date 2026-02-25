import {
	GET as courseBuilderGET,
	POST as courseBuilderPOST,
} from '@/coursebuilder/course-builder-config'
import { withSkill } from '@/server/with-skill'

export const GET = withSkill(courseBuilderGET)
export const POST = withSkill(courseBuilderPOST)
