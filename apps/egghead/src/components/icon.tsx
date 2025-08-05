import * as React from 'react'
import { icons, type LucideProps } from 'lucide-react'

/**
 * A dynamic icon component that renders Lucide icons by name.
 *
 * @param name - The name of the Lucide icon to render
 * @param props - Additional props to pass to the icon component
 * @returns A rendered Lucide icon component
 */
export const Icon: React.FC<
	LucideProps & {
		name: keyof typeof icons
	}
> = ({ name, ...props }) => {
	const LucideIcon = icons[name]
	return <LucideIcon {...props} />
}
