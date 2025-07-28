import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PostsPagination } from '../posts-pagination'

// Mock next/navigation
vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
	usePathname: vi.fn(),
	useSearchParams: vi.fn(),
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

describe('PostsPagination', () => {
	const mockPush = vi.fn()
	const mockSearchParams = new URLSearchParams()

	beforeEach(() => {
		vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
		vi.mocked(usePathname).mockReturnValue('/posts')
		vi.mocked(useSearchParams).mockReturnValue(mockSearchParams)
		mockPush.mockClear()
	})

	it('should not render when there is only one page', () => {
		const { container } = render(
			<PostsPagination currentPage={1} pageSize={50} totalCount={30} />,
		)

		expect(container.firstChild).toBeNull()
	})

	it('should render pagination controls when there are multiple pages', () => {
		const { getByText } = render(
			<PostsPagination currentPage={1} pageSize={50} totalCount={150} />,
		)

		expect(getByText('1')).toBeInTheDocument()
		expect(getByText('2')).toBeInTheDocument()
		expect(getByText('3')).toBeInTheDocument()
		expect(getByText('Previous')).toBeInTheDocument()
		expect(getByText('Next')).toBeInTheDocument()
	})

	it('should navigate to next page when Next is clicked', () => {
		const { getByText } = render(
			<PostsPagination currentPage={1} pageSize={50} totalCount={150} />,
		)

		fireEvent.click(getByText('Next'))

		expect(mockPush).toHaveBeenCalledWith('/posts?page=2')
	})

	it('should navigate to previous page when Previous is clicked', () => {
		mockSearchParams.set('page', '2')

		const { getByText } = render(
			<PostsPagination currentPage={2} pageSize={50} totalCount={150} />,
		)

		fireEvent.click(getByText('Previous'))

		expect(mockPush).toHaveBeenCalledWith('/posts')
	})

	it('should preserve search params when navigating', () => {
		mockSearchParams.set('search', 'typescript')
		mockSearchParams.set('postType', 'lesson')

		const { getByText } = render(
			<PostsPagination currentPage={1} pageSize={50} totalCount={150} />,
		)

		fireEvent.click(getByText('2'))

		expect(mockPush).toHaveBeenCalledWith(
			'/posts?search=typescript&postType=lesson&page=2',
		)
	})

	it('should reset to page 1 when page size changes', () => {
		mockSearchParams.set('page', '3')

		const { getByText, getByRole } = render(
			<PostsPagination currentPage={3} pageSize={50} totalCount={300} />,
		)

		// Open select and choose 100
		const select = getByRole('combobox')
		fireEvent.click(select)
		fireEvent.click(getByText('100'))

		expect(mockPush).toHaveBeenCalledWith('/posts?pageSize=100')
	})

	it('should show ellipsis for large page ranges', () => {
		const { getAllByText } = render(
			<PostsPagination currentPage={5} pageSize={50} totalCount={1000} />,
		)

		const ellipses = getAllByText('More pages')
		expect(ellipses.length).toBeGreaterThan(0)
	})

	it('should disable Previous on first page', () => {
		const { getByText } = render(
			<PostsPagination currentPage={1} pageSize={50} totalCount={150} />,
		)

		const prevButton = getByText('Previous').closest('a')
		expect(prevButton).toHaveClass('pointer-events-none', 'opacity-50')
	})

	it('should disable Next on last page', () => {
		const { getByText } = render(
			<PostsPagination currentPage={3} pageSize={50} totalCount={150} />,
		)

		const nextButton = getByText('Next').closest('a')
		expect(nextButton).toHaveClass('pointer-events-none', 'opacity-50')
	})

	it('should display correct results info', () => {
		const { getByText } = render(
			<PostsPagination currentPage={2} pageSize={50} totalCount={142} />,
		)

		expect(getByText('Showing 51-100 of 142 posts')).toBeInTheDocument()
	})

	it('should log navigation events', async () => {
		const { getByText } = render(
			<PostsPagination currentPage={1} pageSize={50} totalCount={150} />,
		)

		fireEvent.click(getByText('2'))

		const { logger } = await import('@/lib/utils/logger')
		expect(logger.info).toHaveBeenCalledWith('Pagination navigation', {
			fromPage: 1,
			toPage: 2,
			pageSize: 50,
		})
	})
})
