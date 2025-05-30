'use client'

import { Button } from '@coursebuilder/ui'

import { switchOrganization } from '../organization-list/actions'

export default function OrgSwitch({
	organizationId,
}: {
	organizationId: string
}) {
	return (
		<Button
			onClick={() => {
				switchOrganization(organizationId)
			}}
		>
			Switch to this organization
		</Button>
	)
}

export function CurrentOrgSwitch() {
	return (
		<Button disabled variant="outline">
			Current Organization
		</Button>
	)
}
