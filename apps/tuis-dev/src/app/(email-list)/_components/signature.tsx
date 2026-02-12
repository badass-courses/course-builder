import config from '@/config'

export const Signature = () => {
	//TODO: add a signature
	return (
		<span className="text-muted-foreground sm:text-xl">— {config.author}</span>
	)
}
