/**
 * Test script to verify the correct format for Dropbox-API-Select-User header
 *
 * This script will try both formats (with and without dbid: prefix) to see which one works.
 *
 * Usage:
 *   node scripts/test-dropbox-account-id.js
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

console.log('🧪 Testing Dropbox account ID format...\n')
console.log(`Original value: "${DROPBOX_TEAM_MEMBER_ID}"\n`)

// Test format 1: With dbid: prefix
const format1 = DROPBOX_TEAM_MEMBER_ID.startsWith('dbid:')
	? DROPBOX_TEAM_MEMBER_ID
	: `dbid:${DROPBOX_TEAM_MEMBER_ID}`

// Test format 2: Without dbid: prefix
const format2 = DROPBOX_TEAM_MEMBER_ID.startsWith('dbid:')
	? DROPBOX_TEAM_MEMBER_ID.substring(5)
	: DROPBOX_TEAM_MEMBER_ID

console.log(`Format 1 (WITH dbid:): "${format1}"`)
console.log(`Format 2 (WITHOUT dbid:): "${format2}"\n`)

// Also check if DROPBOX_TEAM_MEMBER_EMAIL is set (alternative approach)
const DROPBOX_TEAM_MEMBER_EMAIL = process.env.DROPBOX_TEAM_MEMBER_EMAIL
if (DROPBOX_TEAM_MEMBER_EMAIL) {
	console.log(`Format 3 (EMAIL): "${DROPBOX_TEAM_MEMBER_EMAIL}"\n`)
}

async function testFormat(headerValue, formatName) {
	console.log(`\n📤 Testing ${formatName}...`)
	console.log(`   Header value: "${headerValue}"`)

	const headers = {
		Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
		'Content-Type': 'application/json',
		'Dropbox-API-Select-User': headerValue,
	}

	try {
		const response = await fetch(
			'https://api.dropboxapi.com/2/files/list_folder',
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					path: '',
					recursive: false,
				}),
			},
		)

		const responseText = await response.text()

		if (response.ok) {
			console.log(`   ✅ SUCCESS! This format works!`)
			return true
		} else {
			console.log(`   ❌ FAILED: ${response.status} ${response.statusText}`)
			console.log(`   Response: ${responseText.substring(0, 200)}`)
			return false
		}
	} catch (error) {
		console.log(`   ❌ ERROR: ${error.message}`)
		return false
	}
}

// Test both formats
const result1 = await testFormat(format1, 'Format 1 (WITH dbid:)')
const result2 = await testFormat(format2, 'Format 2 (WITHOUT dbid:)')
let result3 = false
if (DROPBOX_TEAM_MEMBER_EMAIL) {
	result3 = await testFormat(DROPBOX_TEAM_MEMBER_EMAIL, 'Format 3 (EMAIL)')
}

console.log('\n' + '='.repeat(60))
if (result1) {
	console.log('✅ Use Format 1: WITH dbid: prefix')
	console.log(`   Set DROPBOX_TEAM_MEMBER_ID="${format1}"`)
} else if (result2) {
	console.log('✅ Use Format 2: WITHOUT dbid: prefix')
	console.log(`   Set DROPBOX_TEAM_MEMBER_ID="${format2}"`)
} else if (result3) {
	console.log('✅ Use Format 3: EMAIL address')
	console.log(`   Set DROPBOX_TEAM_MEMBER_EMAIL="${DROPBOX_TEAM_MEMBER_EMAIL}"`)
} else {
	console.log('❌ None of the formats worked.')
	console.log('\n💡 Possible issues:')
	console.log('   1. The account ID might be wrong - re-run the browser script')
	console.log('   2. Try using your email address instead')
	console.log('   3. Check if your Dropbox app has the correct permissions')
	console.log('   4. Verify the access token is valid for team access')
}
