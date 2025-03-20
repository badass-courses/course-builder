export const metadata = {
	title: 'Epic Web - User',
	description: 'User authentication for Epic Web',
}

export default function UserLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <div className="min-h-screen">{children}</div>
}
