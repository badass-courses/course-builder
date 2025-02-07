import { createClient } from '@sanity/client'
import { SANITY_SECRET_TOKEN } from 'astro:env/server'
import type { UploadApiResponse } from 'cloudinary'
import groq from 'groq'

import type {
	AllEpisodesQueryResult,
	AllSeriesQueryResult,
	EpisodeBySlugQueryResult,
	PersonByClerkIdQueryResult,
	PersonByIdQueryResult,
	PersonBySlugQueryResult,
	SeriesBySlugQueryResult,
	SupportersQueryResult,
	UpcomingEpisodeBySeriesQueryResult,
} from '../types/sanity'

const client = createClient({
	projectId: 'vnkupgyb',
	dataset: 'develop',
	apiVersion: '2024-08-10',
	token: SANITY_SECRET_TOKEN,
	perspective: 'published',
	useCdn: true,
})

const allSeriesQuery = groq`
  *[_type=="series"] {
    title,
    'slug': slug.current,
    description,
    image {
      public_id,
      height,
      width,
    },
    "collections": collections[]->{
      title,
      'slug': slug.current,
      release_year,
      'episode_count': count(episodes[@->hidden != true && (defined(@->video.youtube_id) || defined(@->video.mux_video))])
    } | order(release_year desc),
    'total_episode_count': count(collections[]->episodes[@->hidden != true && (defined(@->video.youtube_id) || defined(@->video.mux_video))]),
    'latestEpisodeDate': collections[]->episodes[@->hidden != true && (defined(@->video.youtube_id) || defined(@->video.mux_video))] | order(@->publish_date desc)[0]->publish_date,
    featured
  } | order(latestEpisodeDate desc)
`

const seriesBySlugQuery = groq`
  *[_type=="series" && slug.current==$series][0] {
    title,
    'slug': slug.current,
    description,
    image {
      public_id,
      height,
      width,
    },
    'sponsors': sponsors[]->{
      'title': title,
      logo {
        public_id,
        width,
        height
      },
      link,
    },
    'collection': collections[@->slug.current==$collection && @->series._ref==^._id][0]->{
      title,
      'slug': slug.current,
      release_year,
      episodes[@->hidden != true]->{
        title,
        'slug': slug.current,
        short_description,
        publish_date,
        'thumbnail': {
          'public_id': video.thumbnail.public_id,
          'alt': video.thumbnail_alt,
          'width': video.thumbnail.width,
          'height': video.thumbnail.height,
        },
        video {
          youtube_id,
          mux_video,
          members_only
        }
      }
    },
    collections[]->{
      title,
      'slug': slug.current,
      release_year,
    }
  }
`

const allEpisodesQuery = groq`
  *[_type=="episode" && hidden != true] {
    title,
    'slug': slug.current,
    description,
    short_description,
    publish_date,
    'thumbnail': {
      'public_id': video.thumbnail.public_id,
      'width': video.thumbnail.width,
      'height': video.thumbnail.height,
      'alt': video.thumbnail_alt,
    },
    video {
      youtube_id,
      'mux': mux_video.asset->data.playback_ids,
      'captions': captions.asset->url,
      transcript,
    },
    people[]-> {
      user_id,
      name,
      "slug": slug.current,
      photo {
        public_id
      }
    },
    resources[] {
      label,
      url,
    },
    'sponsors': sponsors[]->{
      title,
      logo {
        public_id,
        width,
        height
      },
      link,
    },
    'related_episodes': *[_type=="collection" && references(^._id)][0].episodes[@->hidden != true && (defined(@->video.youtube_id) || defined(@->video.mux_video))]-> {
      title,
      'slug': slug.current,
      short_description,
      publish_date,
      'thumbnail': {
        'public_id': video.thumbnail.public_id,
        'width': video.thumbnail.width,
        'height': video.thumbnail.height,
        'alt': video.thumbnail_alt,
      },
      video {
        youtube_id
      }
    },
    'collection': *[_type=="collection" && references(^._id)][0] {
      'slug': slug.current,
      title,
      'episodeSlugs': episodes[]->slug.current,
    },
    'series': *[_type=="collection" && references(^._id)][0].series->{
      'slug': slug.current,
      title,
    },
  }
`

const episodeBySlugQuery = groq`
  *[_type=="episode" && slug.current==$episode][0] {
    title,
    'slug': slug.current,
    description,
    short_description,
    publish_date,
    'thumbnail': {
      'public_id': video.thumbnail.public_id,
      'width': video.thumbnail.width,
      'height': video.thumbnail.height,
      'alt': video.thumbnail_alt,
    },
    video {
      youtube_id,
      'mux': mux_video.asset->data.playback_ids,
      'captions': captions.asset->url,
      transcript,
    },
    people[]-> {
      user_id,
      name,
      "slug": slug.current,
      photo {
        public_id
      }
    },
    resources[] {
      label,
      url,
    },
    'sponsors': sponsors[]->{
      title,
      logo {
        public_id,
        width,
        height
      },
      link,
    },
    'related_episodes': *[_type=="collection" && references(^._id)][0].episodes[@->hidden != true && (defined(@->video.youtube_id) || defined(@->video.mux_video))]-> {
      title,
      'slug': slug.current,
      short_description,
      publish_date,
      'thumbnail': {
        'public_id': video.thumbnail.public_id,
        'width': video.thumbnail.width,
        'height': video.thumbnail.height,
        'alt': video.thumbnail_alt,
      },
      video {
        youtube_id
      }
    },
    'collection': *[_type=="collection" && references(^._id)][0] {
      'slug': slug.current,
      title,
      'episodeSlugs': episodes[]->slug.current,
    },
    'series': *[_type=="collection" && references(^._id)][0].series->{
      'slug': slug.current,
      title,
    },
  }
`

const upcomingEpisodeBySeriesQuery = groq`
  *[ _type == "collection" && series->slug.current == $seriesSlug] {
    title,
    "schedule": episodes[dateTime(@->publish_date) > dateTime(now()) && !defined(@->video.youtube_id) && !defined(@->video.mux_video) && @->hidden != true]-> {
      title,
      "slug": slug.current,
      short_description,
      publish_date,
      "thumbnail": {
        "src": video.thumbnail.public_id,
        "alt": video.thumbnail_alt,
      }
    }
  }
`

const personByIdQuery = groq`
  *[_type == "person" && user_id == $user_id][0] {
    _id,
    name,
    photo {
      public_id,
      height,
      width,
    },
    bio,
    links[],
    user_id,
    "episodes": *[_type == "episode" && hidden!=true && references(^._id) && (defined(@->video.youtube_id) || defined(@->video.mux_video))] {
      title,
      'slug': slug.current,
      short_description,
      publish_date,
      'thumbnail': {
        'public_id': video.thumbnail.public_id,
        'alt': video.thumbnail_alt,
        'width': video.thumbnail.width,
        'height': video.thumbnail.height,
      },
      video {
        youtube_id,
      },
      'collection': *[_type=="collection" && references(^._id)][0] {
        'slug': slug.current,
        title,
        'episodeSlugs': episodes[]->slug.current,
      },
      'series': *[_type=="collection" && references(^._id)][0].series->{
        'slug': slug.current,
        title,
      },
    } | order(publish_date desc)[0...4]
  }
`
const personBySlugQuery = groq`
  *[_type == "person" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    photo {
      public_id,
      height,
      width,
    },
    bio,
    links[],
    user_id,
    "episodes": *[_type == "episode" && hidden!=true && references(^._id) && (defined(@->video.youtube_id) || defined(@->video.mux_video))] {
      title,
      'slug': slug.current,
      short_description,
      publish_date,
      'thumbnail': {
        'public_id': video.thumbnail.public_id,
        'alt': video.thumbnail_alt,
        'width': video.thumbnail.width,
        'height': video.thumbnail.height,
      },
      video {
        youtube_id,
      },
      'collection': *[_type=="collection" && references(^._id)][0] {
        'slug': slug.current,
        title,
        'episodeSlugs': episodes[]->slug.current,
      },
      'series': *[_type=="collection" && references(^._id)][0].series->{
        'slug': slug.current,
        title,
      },
    } | order(publish_date desc)[0...4]
  }
`

const personByClerkIdQuery = groq`
  *[_type == "person" && user_id == $user_id][0] {
    _id,
    name,
    slug,
    user_id,
  }
`

// *[_type == "person" && subscription.status == "active"] {
const supportersQuery = groq`
  *[_type == "person" && subscription.status == "active"] {
    _id,
    name,
    photo {
      public_id,
      height,
      width,
    },
    'username': slug.current,
    subscription {
      level,
      status
    }
  } | score(
    boost(subscription.level match "Platinum", 3),
    boost(subscription.level match "Gold", 2),
    boost(subscription.level match "Silver", 1),
  ) | order(_score desc)
`

export async function getAllSeries() {
	return client.fetch<AllSeriesQueryResult>(
		allSeriesQuery,
		{},
		{ useCdn: true },
	)
}

export async function getSeriesBySlug(params: {
	series: string
	collection: string
}) {
	return client.fetch<SeriesBySlugQueryResult>(seriesBySlugQuery, params, {
		useCdn: true,
	})
}

export async function getAllEpisodes() {
	return client.fetch<AllEpisodesQueryResult>(
		allEpisodesQuery,
		{},
		{ useCdn: true },
	)
}

export async function getEpisodeBySlug(params: { episode: string }) {
	const episode = await client.fetch<EpisodeBySlugQueryResult>(
		episodeBySlugQuery,
		params,
		{ useCdn: true },
	)

	if (!episode) {
		throw new Error(`Invalid episode ${params.episode}`)
	}

	return episode
}

// TODO use this to build out a LWJ schedule
export async function getUpcomingEpisodeBySeries(params: {
	seriesSlug: string
}) {
	const result = await client.fetch<UpcomingEpisodeBySeriesQueryResult>(
		upcomingEpisodeBySeriesQuery,
		params,
		{
			useCdn: true,
		},
	)

	return result.at(0)?.schedule
}

export async function getPersonById(
	params: { user_id: string },
	options?: { useCdn: boolean },
) {
	return client.fetch<PersonByIdQueryResult>(personByIdQuery, params, {
		useCdn: options?.useCdn ?? true,
	})
}

export async function getPersonBySlug(
	params: { slug: string },
	options?: { useCdn: boolean },
) {
	return client.fetch<PersonBySlugQueryResult>(personBySlugQuery, params, {
		useCdn: options?.useCdn ?? true,
	})
}

export async function getPersonByClerkId(
	params: { user_id: string },
	options?: { useCdn: boolean },
) {
	return client.fetch<PersonByClerkIdQueryResult>(
		personByClerkIdQuery,
		params,
		{
			useCdn: options?.useCdn ?? true,
		},
	)
}

export async function getSupporters() {
	return client.fetch<SupportersQueryResult>(
		supportersQuery,
		{},
		{ useCdn: true },
	)
}

export async function createPerson(
	name: string,
	user_id: string,
	username: string,
	photo: UploadApiResponse,
) {
	return client.create({
		_type: 'person',
		name,
		user_id,
		slug: { current: username },
		photo,
	})
}

export async function updatePersonSubscription(
	id: string,
	subscription: {
		customer: string
		level: string
		status: string
		date: Date
	},
) {
	return client.patch(id).set({ subscription }).commit()
}

export async function updatePersonFromClerk(
	id: string,
	fields: {
		name: string
		username: string
		photo: UploadApiResponse
	},
) {
	return client
		.patch(id)
		.set({
			name: fields.name,
			slug: {
				current: fields.username,
			},
			photo: fields.photo,
		})
		.commit()
}

export async function updatePerson(
	id: string,
	set: {
		// name: string;
		bio: string
		links: Array<{ label: string; url: string }>
	},
) {
	return client.patch(id).set(set).commit({ autoGenerateArrayKeys: true })
}
