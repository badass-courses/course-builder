import { sanityWriteClient } from '@/server/sanity-write-client'

import { SanitySoftwareLibrary } from './schemas'

export const fetchAllSoftwareLibraries = `
  *[_type == "software-library"] {
    _id,
    _type,
    name,
    slug,
    description,
    url,
    image,
    path,
    _createdAt,
    _updatedAt
  }
`

export const fetchSoftwareLibraryById = (id: string) => `
  *[_type == "software-library" && _id == "${id}"][0] {
    _id,
    _type,
    name,
    slug,
    description,
    url,
    image,
    path,
    _createdAt,
    _updatedAt
  }
`

export const createSoftwareLibrary = async (
	library: Partial<SanitySoftwareLibrary>,
) => {
	return await sanityWriteClient.create({
		_type: 'software-library',
		...library,
	})
}

export const updateSoftwareLibrary = async (
	id: string,
	updates: Partial<SanitySoftwareLibrary>,
) => {
	return await sanityWriteClient.patch(id).set(updates).commit()
}

export const deleteSoftwareLibrary = async (id: string) => {
	return await sanityWriteClient.delete(id)
}
