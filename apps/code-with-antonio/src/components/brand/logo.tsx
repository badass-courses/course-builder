import Image from 'next/image'
import { cn } from '@/utils/cn'

import { CldImage } from '../cld-image'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<Image
			src="/assets/logo@2x.png"
			alt="Code with Antonio"
			width={137}
			height={58}
		/>
	)
}

export const LogoMark: React.FC<{ size?: number; className?: string }> = ({
	size = 77,
	className = '',
}) => {
	return (
		<CldImage
			src="https://res.cloudinary.com/dezn0ffbx/image/upload/v1760518174/antonio-waving_2x_sq5xrb.png"
			width={size}
			height={size}
			alt="Code with Antonio"
			className={cn(className)}
		/>
	)
}
