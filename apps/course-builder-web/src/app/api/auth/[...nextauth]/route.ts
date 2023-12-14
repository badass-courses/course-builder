import NextAuth from 'next-auth'

import {authOptions} from '@/server/auth'
import {withSkill} from '@/server/with-skill'

const handler = withSkill(NextAuth(authOptions))
export {handler as GET, handler as POST}
