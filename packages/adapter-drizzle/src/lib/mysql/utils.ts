import { customType } from 'drizzle-orm/mysql-core'

export const datetimeUtc = (name: string, precision: number) =>
	customType<{ data: Date; driverData: string }>({
		dataType() {
			return `datetime(${precision})`
		},
		toDriver(value: Date): string {
			return mysqlDatetimeUtc(value)
		},
		fromDriver(value: string): Date {
			return mysqlDatetimeUtcToDate(value)
		},
	})(name)

function mysqlDatetimeUtc(date: Date = new Date()) {
	return date.toISOString().slice(0, 19).replace('T', ' ')
}
// Use this function instead of new Date() when converting a MySQL datetime to a
// Date object so that the date is interpreted as UTC instead of local time (default behavior)
function mysqlDatetimeUtcToDate(mysqlDatetimeUtc: string) {
	return new Date(mysqlDatetimeUtc.replace(' ', 'T') + 'Z')
}
