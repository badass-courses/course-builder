import { writeContributionTypes } from '@/scripts/controbution-types'
import { migrateArticles } from '@/scripts/migrate-articles'
import { migrateBonuses } from '@/scripts/migrate-bonuses'
import { migrateEvents } from '@/scripts/migrate-events'
import { migratePages } from '@/scripts/migrate-pages'
import { migrateTalks } from '@/scripts/migrate-talks'
import { migrateTips } from '@/scripts/migrate-tips'
import { migrateTutorials } from '@/scripts/migrate-tutorials'
import { migrateWorkshops } from '@/scripts/migrate-workshops'

const WRITE_TO_DB = true

await writeContributionTypes()
await migrateArticles(WRITE_TO_DB)
await migrateTutorials(WRITE_TO_DB)
// await migrateTips(WRITE_TO_DB)
// await migrateWorkshops(WRITE_TO_DB)
// await migratePages(WRITE_TO_DB)
// await migrateEvents(WRITE_TO_DB)
// await migrateTalks(WRITE_TO_DB)
// await migrateBonuses(WRITE_TO_DB)
