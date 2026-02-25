import { GET as authGET, POST as authPOST } from '@/server/auth'
import { withSkill } from '@/server/with-skill'

export const GET = withSkill(authGET)
export const POST = withSkill(authPOST)
