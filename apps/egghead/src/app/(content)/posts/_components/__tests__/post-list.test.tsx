import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PostList from '../post-list'

// Mock the server auth
vi.mock('@/server/auth', () => ({
	getServerAuthSession: vi.fn().mockResolvedValue({
		session: { user: { id: 'test-user' } },
		ability: { can: vi.fn().mockReturnValue(true) },
	}),
}))

// Mock the posts query functions
vi.mock('@/lib/posts-query', () => ({
	getAllMinimalPosts: vi.fn(),
	getAllMinimalPostsForUser: vi.fn(),
	getCachedAllMinimalPosts: vi.fn(),
	getCachedAllMinimalPostsForUser: vi.fn(),
	countAllMinimalPosts: vi.fn(),
	countAllMinimalPostsForUser: vi.fn(),
}))

// Mock the users module
vi.mock('@/lib/users', () => ({
	getCachedEggheadInstructorForUser: vi.fn().mockResolvedValue({
		first_name: 'John',
		last_name: 'Doe',
	}),
	loadEggheadInstructorForUser: vi.fn(),
}))

// Mock the pagination component
vi.mock('../posts-pagination', () => ({
	PostsPagination: ({ currentPage, pageSize, totalCount }: any) => (
		<div data-testid="pagination">
			Page {currentPage} of {Math.ceil(totalCount / pageSize)}
		</div>
	),
}))

// Mock other components
vi.mock('../delete-post-button', () => ({
	DeletePostButton: ({ id }: any) => <button>Delete {id}</button>,
}))

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}))

const mockPosts = [
	{
		id: 'post-1',
		createdById: 'user-1',
		createdAt: new Date(),
		fields: {
			title: 'Test Post 1',
			slug: 'test-post-1',
			state: 'published',
			postType: 'lesson',
		},
		tags: [{ tag: { id: 'tag-1', name: 'JavaScript' } }],
	},
	{
		id: 'post-2',
		createdById: 'user-1',
		createdAt: new Date(),
		fields: {
			title: 'Test Post 2',
			slug: 'test-post-2',
			state: 'draft',
			postType: 'course',
		},
		tags: [],
	},
]

describe('PostList with Pagination', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should render pagination when total posts exceed page size', async () => {
		const { getAllMinimalPosts, countAllMinimalPosts } = await import(
			'@/lib/posts-query'
		)

		vi.mocked(getAllMinimalPosts).mockResolvedValue(mockPosts)
		vi.mocked(countAllMinimalPosts).mockResolvedValue(150)

		const { findByTestId } = render(
			await PostList({
				showAllPosts: true,
				page: 1,
				pageSize: 50,
			}),
		)

		const pagination = await findByTestId('pagination')
		expect(pagination).toBeInTheDocument()
		expect(pagination.textContent).toContain('Page 1 of 3')
	})

	it('should not render pagination when posts fit on one page', async () => {
		const { getAllMinimalPosts, countAllMinimalPosts } = await import(
			'@/lib/posts-query'
		)

		vi.mocked(getAllMinimalPosts).mockResolvedValue(mockPosts)
		vi.mocked(countAllMinimalPosts).mockResolvedValue(2)

		const { queryByTestId } = render(
			await PostList({
				showAllPosts: true,
				page: 1,
				pageSize: 50,
			}),
		)

		const pagination = queryByTestId('pagination')
		expect(pagination).not.toBeInTheDocument()
	})

	it('should show appropriate message when no posts on current page', async () => {
		const { getAllMinimalPosts, countAllMinimalPosts } = await import(
			'@/lib/posts-query'
		)

		vi.mocked(getAllMinimalPosts).mockResolvedValue([])
		vi.mocked(countAllMinimalPosts).mockResolvedValue(50)

		const { findByText } = render(
			await PostList({
				showAllPosts: true,
				page: 3,
				pageSize: 50,
			}),
		)

		const message = await findByText('No posts found on page 3')
		expect(message).toBeInTheDocument()
	})

	it('should fetch posts and count in parallel', async () => {
		const { getAllMinimalPosts, countAllMinimalPosts } = await import(
			'@/lib/posts-query'
		)

		vi.mocked(getAllMinimalPosts).mockResolvedValue(mockPosts)
		vi.mocked(countAllMinimalPosts).mockResolvedValue(100)

		await PostList({
			showAllPosts: true,
			search: 'test',
			page: 2,
			pageSize: 50,
		})

		// Verify both functions were called
		expect(getAllMinimalPosts).toHaveBeenCalledWith('test', undefined, 50, 50)
		expect(countAllMinimalPosts).toHaveBeenCalledWith('test', undefined)
	})

	it('should log rendering information', async () => {
		const { getAllMinimalPosts, countAllMinimalPosts } = await import(
			'@/lib/posts-query'
		)

		vi.mocked(getAllMinimalPosts).mockResolvedValue(mockPosts)
		vi.mocked(countAllMinimalPosts).mockResolvedValue(142)

		await PostList({
			showAllPosts: true,
			page: 2,
			pageSize: 50,
		})

		const { logger } = await import('@/lib/utils/logger')
		expect(logger.info).toHaveBeenCalledWith('PostList rendered', {
			showingPosts: '51-100',
			totalPosts: 142,
			pages: 3,
		})
	})

	it('should hide pagination when totalCount is 0', async () => {
		const { getAllMinimalPosts, countAllMinimalPosts } = await import(
			'@/lib/posts-query'
		)

		vi.mocked(getAllMinimalPosts).mockResolvedValue([])
		vi.mocked(countAllMinimalPosts).mockResolvedValue(0)

		const { queryByTestId, findByText } = render(
			await PostList({
				showAllPosts: true,
				page: 1,
				pageSize: 50,
			}),
		)

		const pagination = queryByTestId('pagination')
		expect(pagination).not.toBeInTheDocument()

		const message = await findByText(
			'No posts found. Create a post to get started',
		)
		expect(message).toBeInTheDocument()
	})
})
