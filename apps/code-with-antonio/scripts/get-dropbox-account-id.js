/**
 * Simple script to get your Dropbox account ID
 *
 * Usage:
 *   node scripts/get-dropbox-account-id.js
 *
 * Make sure DROPBOX_ACCESS_TOKEN is set in your .env file
 */

require('dotenv').config({ path: '.env.local' })

const accessToken = process.env.DROPBOX_ACCESS_TOKEN

if (!accessToken) {
	console.error('❌ DROPBOX_ACCESS_TOKEN not found in environment')
	console.log(
		'\n💡 Make sure you have DROPBOX_ACCESS_TOKEN in your .env.local file',
	)
	process.exit(1)
}

async function getAccountId() {
	try {
		const response = await fetch(
			'https://api.dropboxapi.com/2/users/get_current_account',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`Dropbox API error: ${response.status} ${errorText}`)
		}

		const data = await response.json()

		console.log('\n✅ Your Dropbox Account ID:\n')
		console.log(`   Account ID: ${data.account_id}`)
		console.log(`   Email: ${data.email}`)
		console.log(`   Name: ${data.name.display_name}`)
		console.log('\n📋 Add this to your .env.local:\n')
		console.log(`   DROPBOX_TEAM_MEMBER_ID=${data.account_id}\n`)

		return data.account_id
	} catch (error) {
		console.error('❌ Error:', error.message)
		process.exit(1)
	}
}

getAccountId()
