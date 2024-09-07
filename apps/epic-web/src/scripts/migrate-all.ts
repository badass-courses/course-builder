import { writeContributionTypes } from '@/scripts/controbution-types'
import { migrateArticles } from '@/scripts/migrate-articles'
import { migrateBonuses } from '@/scripts/migrate-bonuses'
import { migrateEvents } from '@/scripts/migrate-events'
import { migratePages } from '@/scripts/migrate-pages'
import { migrateProducts } from '@/scripts/migrate-products'
import { migrateTalks } from '@/scripts/migrate-talks'
import { migrateTips } from '@/scripts/migrate-tips'
import { migrateTutorials } from '@/scripts/migrate-tutorials'
import { migrateWorkshops } from '@/scripts/migrate-workshops'

const WRITE_TO_DB = true

await Promise.all([
	writeContributionTypes(),
	migrateArticles(WRITE_TO_DB),
	migrateTips(WRITE_TO_DB),
	migrateTutorials(WRITE_TO_DB),
	migrateWorkshops(WRITE_TO_DB),
	migratePages(WRITE_TO_DB),
	migrateEvents(WRITE_TO_DB),
	migrateTalks(WRITE_TO_DB),
	migrateBonuses(WRITE_TO_DB),
	migrateProducts(WRITE_TO_DB),
])
