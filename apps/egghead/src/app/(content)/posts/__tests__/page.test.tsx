import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PostsListPage from '../page'

// Mock the server components
vi.mock('@/server/auth', () => ({
	getServerAuthSession: vi.fn().mockResolvedValue({
		session: { user: { id: 'test-user' } },
		ability: { can: vi.fn().mockReturnValue(true) },
	}),
}))

// Mock the child components
vi.mock('../_components/create-post', () => ({
	CreatePost: () => <div>Create Post</div>,
}))

vi.mock('../_components/post-list', () => ({
	default: ({ page, pageSize, search, postType }: any) => (
		<div data-testid="post-list">
			PostList - page: {page}, pageSize: {pageSize}, search: {search || 'none'},
			postType: {postType || 'none'}
		</div>
	),
}))

vi.mock('../_components/post-list-skeleton', () => ({
	CreatePostSkeleton: () => <div>Create Post Skeleton</div>,
	PostListSkeleton: () => <div>Post List Skeleton</div>,
}))

vi.mock('../_components/posts-filter-toggle', () => ({
	PostsFilterToggle: () => <div>Filter Toggle</div>,
}))

vi.mock('../_components/posts-search-filter', () => ({
	PostsSearchFilter: () => <div>Search Filter</div>,
}))

vi.mock('@/lib/utils/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}))

describe('PostsListPage', () => {
	it('should pass default pagination params when none provided', async () => {
		const props = {
			searchParams: Promise.resolve({}),
		}

		const { findByTestId } = render(await PostsListPage(props))
		const postList = await findByTestId('post-list')

		expect(postList.textContent).toContain('page: 1')
		expect(postList.textContent).toContain('pageSize: 50')
	})

	it('should pass custom page and pageSize from URL params', async () => {
		const props = {
			searchParams: Promise.resolve({
				page: '2',
				pageSize: '100',
			}),
		}

		const { findByTestId } = render(await PostsListPage(props))
		const postList = await findByTestId('post-list')

		expect(postList.textContent).toContain('page: 2')
		expect(postList.textContent).toContain('pageSize: 100')
	})

	it('should correctly calculate offset for pagination', async () => {
		const props = {
			searchParams: Promise.resolve({
				page: '3',
				pageSize: '50',
			}),
		}

		await PostsListPage(props)

		// Verify logger was called with correct offset calculation
		const { logger } = await import('@/lib/utils/logger')
		expect(logger.info).toHaveBeenCalledWith('Posts page loaded', {
			page: 3,
			pageSize: 50,
			calculatedOffset: 100, // (3-1) * 50
		})
	})

	it('should pass search and filter params alongside pagination', async () => {
		const props = {
			searchParams: Promise.resolve({
				page: '2',
				pageSize: '100',
				search: 'typescript',
				postType: 'lesson',
			}),
		}

		const { findByTestId } = render(await PostsListPage(props))
		const postList = await findByTestId('post-list')

		expect(postList.textContent).toContain('page: 2')
		expect(postList.textContent).toContain('pageSize: 100')
		expect(postList.textContent).toContain('search: typescript')
		expect(postList.textContent).toContain('postType: lesson')
	})
})
