import { sanityWriteClient } from '@/server/sanity-write-client'

import { systemFieldsProjection } from '../utils/projections'
import { SanityCourse, SanityCourseSchema } from './schemas'

const courseProjectionQueryString: string = `
  ${systemFieldsProjection},
  title,
  slug,
  summary,
  description,
  searchIndexingState,
  imageIllustrator->{
    _id,
    _type,
    _ref
  },
  softwareLibraries[]{
    _key,
    _type,
    library->{
      _id,
      _type,
      _ref
    }
  },
  collaborators[]->{
    _id,
    _type,
    _ref
  },
  image,
  accessLevel,
  sharedId,
  resources[]->{
    _id,
    _type,
    _ref
  },
  images[]{
    _key,
    _type,
    asset->{
      _id,
      _type,
      _ref
    }
  },
  railsCourseId,
  productionProcessState
`

export const fetchAllCoursesQueryString: string = `
  *[_type == "course"] {
    ${courseProjectionQueryString}
  }
`

export const fetchCourseByIdQueryString = (id: string): string => `
  *[_type == "course" && _id == "${id}"][0] {
    ${courseProjectionQueryString}
  }
`

export const createCourse = async (course: Partial<SanityCourse>) => {
	return await sanityWriteClient.create({
		_type: 'course',
		...course,
	})
}

export const updateCourse = async (
	id: string,
	updates: Partial<SanityCourse>,
) => {
	return await sanityWriteClient.patch(id).set(updates).commit()
}

export const deleteCourse = async (id: string) => {
	return await sanityWriteClient.delete(id)
}
