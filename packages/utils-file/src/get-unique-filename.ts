import { generate } from 'shortid'

/**
 * Extracts the file extension from a filename
 * @private
 * @param filename - The filename to extract the extension from
 * @param opts - Options for extension extraction
 * @param opts.preserveCase - Whether to preserve the case of the extension (defaults to false)
 * @returns The file extension (without the dot) or empty string if none
 */
function fileExtension(
	filename: string,
	opts: { preserveCase?: boolean } = {},
): string {
	if (!opts) opts = {}
	if (!filename) return ''
	const ext = (/[^./\\]*$/.exec(filename) || [''])[0]
	return opts.preserveCase ? ext : ext.toLowerCase()
}

/**
 * Generates a unique filename by adding a random ID and cleaning the string
 * for compatibility with services like S3
 *
 * @param fullFilename - The original filename including extension
 * @returns A unique filename with the same extension
 * @example
 * // Returns something like "my-image-a1b2c3.jpg"
 * getUniqueFilename('my image.jpg')
 *
 * // For filenames without extension, returns something like "test-a1b2c3.test"
 * getUniqueFilename('test')
 */
export const getUniqueFilename = (fullFilename: string): string => {
	// filename with no extension
	const filename = fullFilename.replace(/\.[^/.]+$/, '')
	// remove stuff s3 hates
	const scrubbed = `${filename}-${generate()}`
		.replace(/[^\w\d_\-.]+/gi, '')
		.toLowerCase()

	// Get the extension
	const extension = fileExtension(fullFilename)

	// If the file has no extension, use the original filename as extension
	const finalExtension = extension || filename

	// rebuild it as a fresh new thing
	return `${scrubbed}.${finalExtension.toLowerCase()}`
}
