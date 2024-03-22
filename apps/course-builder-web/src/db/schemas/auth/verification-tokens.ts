import { mysqlTable } from '@/db/mysql-table'

import { getVerificationTokensSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { verificationTokens } = getVerificationTokensSchema(mysqlTable)
