'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

import { switchOrganization } from '../organization-list/actions'

export default function OrgSwitch({
	organizationId,
}: {
	organizationId: string
}) {
	const [isPending, startTransition] = useTransition()

	const handleSwitch = () => {
		startTransition(async () => {
			try {
				await switchOrganization(organizationId)
			} catch (error) {
				// Error handling - you could add a toast notification here
				console.error('Failed to switch organization:', error)
			}
		})
	}

	return (
		<Button onClick={handleSwitch} disabled={isPending} className="w-full">
			{isPending ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Switching...
				</>
			) : (
				'Switch to this organization'
			)}
		</Button>
	)
}

export function CurrentOrgSwitch() {
	return (
		<Button disabled variant="outline" className="w-full">
			Current Organization
		</Button>
	)
}
