export type DropboxEntry = {
	'.tag': 'file' | 'folder'
	name: string
	path_lower?: string
	path_display?: string
	id?: string
}

export type DropboxClientOptions = {
	token: string
	teamMemberId?: string
	teamNamespaceId?: string
}

const buildHeaders = (opts: DropboxClientOptions): Record<string, string> => {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${opts.token}`,
		'Content-Type': 'application/json',
	}
	if (opts.teamMemberId) {
		headers['Dropbox-API-Select-User'] = opts.teamMemberId
	}
	if (opts.teamNamespaceId) {
		headers['Dropbox-API-Path-Root'] = JSON.stringify({
			'.tag': 'namespace_id',
			namespace_id: opts.teamNamespaceId,
		})
	}
	return headers
}

export const listFolder = async (
	opts: DropboxClientOptions,
	sharedUrl: string,
	folderPath = '',
): Promise<DropboxEntry[]> => {
	const res = await fetch(
		'https://api.dropboxapi.com/2/files/list_folder',
		{
			method: 'POST',
			headers: buildHeaders(opts),
			body: JSON.stringify({
				shared_link: { url: sharedUrl },
				path: folderPath,
			}),
		},
	)
	if (!res.ok) {
		const errorBody = await res.text()
		throw new Error(
			`Dropbox API error ${res.status}: ${errorBody}`,
		)
	}
	const data = (await res.json()) as {
		entries: DropboxEntry[]
	}
	return data.entries
}

export const getTemporaryLink = async (
	opts: DropboxClientOptions,
	path: string,
): Promise<string> => {
	const res = await fetch(
		'https://api.dropboxapi.com/2/files/get_temporary_link',
		{
			method: 'POST',
			headers: buildHeaders(opts),
			body: JSON.stringify({ path }),
		},
	)
	if (!res.ok) {
		const errorBody = await res.text()
		throw new Error(
			`Dropbox get_temporary_link error ${res.status}: ${errorBody}`,
		)
	}
	const data = (await res.json()) as { link: string }
	return data.link
}
