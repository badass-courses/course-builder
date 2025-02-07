// https://byby.dev/js-slugify-string
const slugify = function (str) {
	return String(str)
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.trim() // trim leading or trailing whitespace
		.toLowerCase() // convert to lowercase
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-') // remove consecutive hyphens
}

module.exports = {
	entry: async function (params, settings) {
		const currentFile = Object.assign({}, params.app.workspace.getActiveFile())
		const type = settings.Type

		if (type === 'File') {
			const slug = slugify(currentFile.basename)

			const slugified = currentFile.path
				.replaceAll(currentFile.basename, slug)
				.replaceAll(/md$/g, 'mdx')

			await params.app.fileManager.renameFile(currentFile, slugified)
		} else if (type === 'Folder') {
			const folderName = currentFile.parent.name

			const slug = slugify(folderName)

			const newName = currentFile.path.replaceAll(folderName, slug)
			const newFolderName = newName.slice(0, -9)

			await params.app.vault.createFolder(newFolderName)
			await params.app.fileManager.renameFile(currentFile, newName)
			await params.app.vault.delete(currentFile.parent, true)
		}
	},
	settings: {
		name: 'Slugify',
		author: 'Lazar Nikolov',
		options: {
			Type: {
				type: 'dropdown',
				defaultValue: 'File',
				options: ['File', 'Folder'],
			},
		},
	},
}
