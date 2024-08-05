'use server'

import { redirect } from 'next/navigation'

export const onPageSave = async () => {
	'use server'
	redirect(`/admin/pages`)
}
