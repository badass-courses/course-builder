import { GET as authGet, POST as authPost } from '@/server/auth'
import { withSkill } from '@/server/with-skill'

export const GET = withSkill(authGet)
export const POST = withSkill(authPost)
