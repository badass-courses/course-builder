import uuid from 'shortid'

function fileExtension(
  filename: string,
  opts: {preserveCase?: boolean} = {},
): string {
  if (!opts) opts = {}
  if (!filename) return ''
  var ext = (/[^./\\]*$/.exec(filename) || [''])[0]
  return opts.preserveCase ? ext : ext.toLowerCase()
}

export const getUniqueFilename = (fullFilename: string) => {
  // filename with no extension
  const filename = fullFilename.replace(/\.[^/.]+$/, '')
  // remove stuff s3 hates
  const scrubbed = `${filename}-${uuid.generate()}`
    .replace(/[^\w\d_\-.]+/gi, '')
    .toLowerCase()
  // rebuild it as a fresh new thing
  return `${scrubbed}.${fileExtension(fullFilename)}`
}
