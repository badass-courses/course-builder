/**
 * ============================================================================
 * DROPBOX ACCOUNT ID GETTER - Browser Console Script
 * ============================================================================
 *
 * INSTRUCTIONS:
 * 1. Go to https://www.dropbox.com and log in
 * 2. Open DevTools (F12 or Cmd+Option+I)
 * 3. Go to Console tab
 * 4. Paste this ENTIRE script and press Enter
 * 5. It will show your account ID
 *
 * ============================================================================
 */

;(async function () {
	console.log('🔍 Getting your Dropbox account ID...\n')

	try {
		// Get your access token from localStorage or cookies
		// Dropbox stores it in different places, let's try to find it
		let accessToken = null

		// Try to get from localStorage
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key && key.includes('dropbox') && key.includes('token')) {
				const value = localStorage.getItem(key)
				if (value && value.length > 50) {
					accessToken = value
					break
				}
			}
		}

		// If not found, try cookies
		if (!accessToken) {
			const cookies = document.cookie.split(';')
			for (const cookie of cookies) {
				if (cookie.includes('dropbox') && cookie.includes('token')) {
					const match = cookie.match(/token[^=]*=([^;]+)/)
					if (match) {
						accessToken = match[1].trim()
						break
					}
				}
			}
		}

		// If still not found, prompt user
		if (!accessToken) {
			accessToken = prompt(
				'Access token not found in browser storage.\n\n' +
					'Please paste your DROPBOX_ACCESS_TOKEN here:',
			)

			if (!accessToken) {
				console.error('❌ No access token provided')
				return
			}
		}

		// Call Dropbox API
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
			throw new Error(`API Error: ${response.status} - ${errorText}`)
		}

		const data = await response.json()

		console.log('✅ SUCCESS!\n')
		console.log('📋 Your Account Info:')
		console.log(`   Account ID: ${data.account_id}`)
		console.log(`   Email: ${data.email}`)
		console.log(`   Name: ${data.name.display_name}`)
		console.log(`   Country: ${data.country || 'N/A'}\n`)
		console.log(
			'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
		)
		console.log('📝 Add this to your .env.local file:\n')
		console.log(`   DROPBOX_TEAM_MEMBER_ID=${data.account_id}\n`)
		console.log(
			'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
		)

		// Copy to clipboard if possible
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(
				`DROPBOX_TEAM_MEMBER_ID=${data.account_id}`,
			)
			console.log(
				'✅ Copied to clipboard! Just paste it into your .env.local file\n',
			)
		}

		return data.account_id
	} catch (error) {
		console.error('❌ Error:', error.message)
		console.log(
			'\n💡 Alternative: Use your DROPBOX_ACCESS_TOKEN from .env.local',
		)
		console.log('   Run: node scripts/get-dropbox-account-id.js\n')
	}
})()
