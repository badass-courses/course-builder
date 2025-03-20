export const metadata = {
	title: 'Epic Web Content',
	description: 'Content for Epic Web by Kent C. Dodds',
}

export default function ContentLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <div className="container mx-auto px-4 py-8">{children}</div>
}
