/**
 * Script to get Dropbox team namespace ID for accessing team folders
 *
 * Usage:
 *   node scripts/get-dropbox-namespace-id.js
 *
 * Make sure DROPBOX_ACCESS_TOKEN and DROPBOX_TEAM_MEMBER_ID are set in your .env.local
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually (since we're in ES module mode)
function loadEnv() {
	const envPath = resolve(process.cwd(), '.env.local')
	try {
		const envContent = readFileSync(envPath, 'utf-8')
		envContent.split('\n').forEach((line) => {
			const trimmed = line.trim()
			if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
				const [key, ...valueParts] = trimmed.split('=')
				const value = valueParts.join('=').replace(/^["']|["']$/g, '')
				process.env[key.trim()] = value.trim()
			}
		})
	} catch (error) {
		console.warn('Could not load .env.local:', error.message)
	}
}

loadEnv()

const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN
const DROPBOX_TEAM_MEMBER_ID = process.env.DROPBOX_TEAM_MEMBER_ID

if (!DROPBOX_ACCESS_TOKEN) {
	console.error('❌ DROPBOX_ACCESS_TOKEN is not set')
	process.exit(1)
}

if (!DROPBOX_TEAM_MEMBER_ID) {
	console.error('❌ DROPBOX_TEAM_MEMBER_ID is not set')
	process.exit(1)
}

async function getTeamNamespaces() {
	// team/namespaces/list doesn't support Dropbox-API-Select-User
	// So we'll try to get it from team info or by trying to access team folders
	const headers = {
		Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
		'Content-Type': 'application/json',
	}

	try {
		// First, try to get team info
		const teamInfoResponse = await fetch(
			'https://api.dropboxapi.com/2/team/get_info',
			{
				method: 'POST',
				headers,
			},
		)

		if (teamInfoResponse.ok) {
			const teamInfo = await teamInfoResponse.json()
			console.log('\n✅ Team Info:')
			console.log(JSON.stringify(teamInfo, null, 2))
		}

		// Try to list root with team member selection to see what namespaces are available
		const listHeaders = {
			...headers,
			'Dropbox-API-Select-User': DROPBOX_TEAM_MEMBER_ID,
		}

		// Try accessing the team folder directly
		console.log('\n🔍 Trying to access team folder directly...\n')
		const folderResponse = await fetch(
			'https://api.dropboxapi.com/2/files/get_metadata',
			{
				method: 'POST',
				headers: listHeaders,
				body: JSON.stringify({
					path: '/_egghead-team',
				}),
			},
		)

		if (folderResponse.ok) {
			const folderData = await folderResponse.json()
			console.log('✅ Found team folder:')
			console.log(JSON.stringify(folderData, null, 2))

			// Check if there's namespace info in the response
			if (folderData.path_root) {
				console.log('\n📝 Path root found:')
				console.log(JSON.stringify(folderData.path_root, null, 2))
				if (folderData.path_root.namespace_id) {
					console.log(`\n✅ Use this namespace ID:\n`)
					console.log(
						`DROPBOX_TEAM_NAMESPACE_ID=${folderData.path_root.namespace_id}\n`,
					)
					return
				}
			}
		} else {
			const errorText = await folderResponse.text()
			console.log(`⚠️  Could not access /_egghead-team directly: ${errorText}`)
		}

		// Get team namespaces (without Select-User header)
		const response = await fetch(
			'https://api.dropboxapi.com/2/team/namespaces/list',
			{
				method: 'POST',
				headers,
				body: JSON.stringify({ limit: 1000 }),
			},
		)

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`Dropbox API error: ${response.status} ${errorText}`)
		}

		const data = await response.json()
		const namespaces = data.namespaces || []

		console.log('\n✅ Found team namespaces:\n')
		console.log(
			'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
		)

		namespaces.forEach((ns) => {
			console.log(`\nName: ${ns.name}`)
			console.log(`Type: ${ns.namespace_id}`)
			console.log(`Namespace ID: ${ns.namespace_id}`)
			if (ns.namespace_type?.['.tag']) {
				console.log(`Namespace Type: ${ns.namespace_type['.tag']}`)
			}
		})

		console.log(
			'\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
		)

		// Find team namespace (usually the first one or one with team type)
		const teamNamespace =
			namespaces.find(
				(ns) =>
					ns.namespace_type?.['.tag'] === 'team_folder' ||
					ns.name?.toLowerCase().includes('team') ||
					ns.name?.toLowerCase().includes('egghead'),
			) || namespaces[0]

		if (teamNamespace) {
			console.log('📝 Recommended namespace (for team folders):\n')
			console.log(`DROPBOX_TEAM_NAMESPACE_ID=${teamNamespace.namespace_id}\n`)
		} else {
			console.log(
				'⚠️  No team namespace found. You may need to use a different namespace.\n',
			)
		}

		return namespaces
	} catch (error) {
		console.error('❌ Error:', error.message)
		console.log('\n💡 Alternative: Try listing root with different path roots')
		process.exit(1)
	}
}

getTeamNamespaces()
