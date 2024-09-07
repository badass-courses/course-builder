import { Pool } from 'pg'

const connectionString = process.env.EGGHEAD_POSTGRES_DATABASE_URL

const pool = new Pool({
	connectionString,
	ssl: {
		rejectUnauthorized: false,
	},
})

export const eggheadPgQuery = async (sql: string, params?: any[]) => {
	const start = Date.now()
	const res = await pool.query(sql, params)
	const duration = Date.now() - start
	console.log('executed query', { sql, duration, rows: res.rowCount })
	return res
}

export const getEggheadPostgresClient = async () => {
	return await pool.connect()
}
