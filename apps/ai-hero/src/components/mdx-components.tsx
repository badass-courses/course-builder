import { CldImage } from '@/app/_components/cld-image'

export const Testimonial = ({
	children,
	authorName,
	authorAvatar,
}: {
	children: React.ReactNode
	authorName: string
	authorAvatar: string
}) => {
	return (
		<blockquote className="border-primary">
			{children}
			{authorName && (
				<div className="text-muted-foreground flex items-center gap-2 text-[80%] font-normal not-italic">
					{authorAvatar && authorAvatar.includes('res.cloudinary') && (
						<CldImage
							alt={authorName}
							width={40}
							className="!my-0 rounded-full"
							height={40}
							src={authorAvatar}
						/>
					)}
					{authorName}
				</div>
			)}
		</blockquote>
	)
}
