/**
 * ============================================================================
 * SIMPLE BROWSER CONSOLE SCRIPT
 * ============================================================================
 *
 * 1. Go to https://www.dropbox.com (logged in)
 * 2. Open DevTools Console (F12 → Console tab)
 * 3. Paste your DROPBOX_ACCESS_TOKEN when prompted
 * 4. Get your account ID!
 *
 * ============================================================================
 */

;(async function () {
	console.log('🔍 Dropbox Account ID Getter\n')

	// Get your access token (paste it when prompted)
	const accessToken = prompt('Paste your DROPBOX_ACCESS_TOKEN:')

	if (!accessToken) {
		console.error('❌ No token provided')
		return
	}

	try {
		// Try to get current account first (works for personal tokens)
		let response = await fetch(
			'https://api.dropboxapi.com/2/users/get_current_account',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		// If it's a team token, we need to list team members
		if (!response.ok) {
			const errorText = await response.text()
			if (errorText.includes('Dropbox Business team')) {
				console.log('ℹ️  Team token detected! Listing team members...\n')

				// Get email address to find the right member
				const email = prompt(
					'Enter the team member email (e.g., nicoll@egghead.io):',
				)
				if (!email) {
					console.error('❌ Email required for team tokens')
					return
				}

				// List team members (this works with team tokens)
				const teamResponse = await fetch(
					'https://api.dropboxapi.com/2/team/members/list',
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ limit: 1000 }),
					},
				)

				if (!teamResponse.ok) {
					const error = await teamResponse.text()
					throw new Error(`Failed to list team members: ${error}`)
				}

				const teamData = await teamResponse.json()
				const members = teamData.members || []

				// Find the member by email
				const member = members.find(
					(m) => m.profile.email.toLowerCase() === email.toLowerCase(),
				)

				if (!member) {
					console.error(`❌ Team member with email ${email} not found`)
					console.log('\n📋 Available team members:')
					members.forEach((m) => {
						console.log(
							`   - ${m.profile.email} (${m.profile.name.display_name})`,
						)
					})
					return
				}

				// Show the full member object to see all available fields
				console.log('\n🔍 Full team member object:')
				console.log(JSON.stringify(member, null, 2))

				// Extract IDs - team_member_id is preferred for Dropbox-API-Select-User
				const accountId = member.profile?.account_id || member.account_id
				const teamMemberId =
					member.profile?.team_member_id || member.team_member_id

				const accountData = {
					account_id: accountId,
					team_member_id: teamMemberId,
					email: member.profile?.email,
					name: { display_name: member.profile?.name?.display_name },
				}

				console.log('\n✅ SUCCESS!\n')
				console.log(
					'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
				)
				console.log('📋 All available fields from team member:')
				console.log(JSON.stringify(accountData, null, 2))
				console.log(
					'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
				)
				console.log(`Account ID: ${accountData.account_id}`)
				console.log(`Email: ${accountData.email}`)
				console.log(`Name: ${accountData.name?.display_name || 'N/A'}`)
				if (accountData.profile?.team_member_id) {
					console.log(`Team Member ID: ${accountData.profile.team_member_id}`)
				}
				console.log(
					'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
				)
				console.log('📝 Copy this to your .env.local:\n')
				// Prefer team_member_id over account_id for Dropbox-API-Select-User
				if (accountData.team_member_id) {
					console.log(`DROPBOX_TEAM_MEMBER_ID=${accountData.team_member_id}`)
					console.log('✅ Using team_member_id (recommended for team tokens)')
				} else if (accountData.account_id) {
					console.log(`DROPBOX_TEAM_MEMBER_ID=${accountData.account_id}`)
					console.log(
						'⚠️  Using account_id (team_member_id preferred if available)',
					)
				}
				console.log('')

				// Try to copy to clipboard
				if (navigator.clipboard) {
					await navigator.clipboard.writeText(
						`DROPBOX_TEAM_MEMBER_ID=${accountData.account_id}`,
					)
					console.log('✅ Copied to clipboard!\n')
				}

				return accountData.account_id
			} else {
				const error = await response.text()
				throw new Error(`${response.status}: ${error}`)
			}
		}

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`${response.status}: ${error}`)
		}

		const data = await response.json()

		console.log('\n✅ SUCCESS!\n')
		console.log(
			'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
		)
		console.log(`Account ID: ${data.account_id}`)
		console.log(`Email: ${data.email}`)
		console.log(`Name: ${data.name.display_name}`)
		console.log(
			'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
		)
		console.log('📝 Copy this to your .env.local:\n')
		console.log(`DROPBOX_TEAM_MEMBER_ID=${data.account_id}\n`)

		// Try to copy to clipboard
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(
				`DROPBOX_TEAM_MEMBER_ID=${data.account_id}`,
			)
			console.log('✅ Copied to clipboard!\n')
		}
	} catch (error) {
		console.error('❌ Error:', error.message)
	}
})()
