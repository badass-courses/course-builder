const { ingestDatabaseDump } = require('../rag')

const main = async () => {
	const url = process.argv[2]

	if (!url) {
		console.error('Please provide a URL as an argument.')
		process.exit(1)
	}

	try {
		await ingestDatabaseDump(url)
		console.log('Data ingestion completed successfully.')
	} catch (error) {
		console.error('Error occurred during data ingestion:', error)
		process.exit(1)
	}
}

main()
