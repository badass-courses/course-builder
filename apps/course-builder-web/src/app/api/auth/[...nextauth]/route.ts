import { authOptions } from '@/server/auth'
import { withSkill } from '@/server/with-skill'
import NextAuth from 'next-auth'

const handler = withSkill(NextAuth(authOptions))
export { handler as GET, handler as POST }
