import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
	label: string
	href?: string
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[]
	className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
	return (
		<nav
			className={cn('flex items-center space-x-2 text-sm', className)}
			aria-label="Breadcrumb"
		>
			{items.map((item, index) => (
				<React.Fragment key={index}>
					{index > 0 && (
						<ChevronRight className="text-muted-foreground h-4 w-4" />
					)}
					{item.href ? (
						<Link
							href={item.href}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							{item.label}
						</Link>
					) : (
						<span className="text-foreground font-medium">{item.label}</span>
					)}
				</React.Fragment>
			))}
		</nav>
	)
}

interface WorkshopBreadcrumbsProps {
	courseTitle: string
	courseSlug: string
	lessonTitle: string
	className?: string
}

export function WorkshopBreadcrumbs({
	courseTitle,
	courseSlug,
	lessonTitle,
	className,
}: WorkshopBreadcrumbsProps) {
	const items: BreadcrumbItem[] = [
		{ label: 'Workshops', href: '/workshops' },
		{ label: courseTitle, href: `/workshops/${courseSlug}` },
		{ label: lessonTitle },
	]

	return <Breadcrumbs items={items} className={className} />
}
