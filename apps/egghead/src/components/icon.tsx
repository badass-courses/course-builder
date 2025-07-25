import * as React from 'react'
import { icons, type LucideProps } from 'lucide-react'

export const Icon: React.FC<
	LucideProps & {
		name: keyof typeof icons
	}
> = ({ name, ...props }) => {
	const LucideIcon = icons[name]
	return <LucideIcon {...props} />
}
