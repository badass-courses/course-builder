import type { Metadata } from 'next'
import { Logo, LogoMark } from '@/components/brand/logo'
import { LogoAsset } from '@/components/brand/logo-assets'
import LayoutClient from '@/components/layout-client'

export const metadata: Metadata = {
	title: `${process.env.NEXT_PUBLIC_SITE_TITLE} Brand`,
	description: `${process.env.NEXT_PUBLIC_SITE_TITLE} Logo and Additional Branding Assets`,
}

export default async function BrandRoute() {
	return (
		<LayoutClient withContainer>
			<main className="container flex min-h-[calc(100vh-var(--nav-height))] flex-col border-x">
				<div className="max-w-(--breakpoint-lg) mx-auto flex w-full items-center justify-center border-x border-b py-16">
					<h1 className="font-heading text-center text-5xl font-bold sm:text-6xl">
						Brand
					</h1>
				</div>
				<article className="divide-border max-w-(--breakpoint-lg) mx-auto flex h-full w-full shrink-0 flex-col items-center divide-y border-x border-b">
					<LogoAsset
						className="bg-background"
						asset={
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="210"
								height="58"
								fill="none"
								viewBox="0 0 210 58"
							>
								<g clipPath="url(#a)">
									<path
										fill="#fff"
										fillRule="evenodd"
										d="m58.966-.978.228-.206-3.849-3.464-23.86 21.477V-.414h-5.178V16.27L3.068-4.648-.769-1.195l-.001-.001-3.465 3.849 20.919 23.239H.024v5.178h17.218L-4.235 54.93l3.465 3.849L26.223 28.79-.666-1.08l29.873 26.89L56.899.881l-25.122 27.91L58.77 58.778l3.464-3.85L40.757 31.07h17.219v-5.178h-16.66l20.918-23.24-3.268-3.63Zm.228 60.16L29.207 32.19-.781 59.183l3.849 3.464L26.307 41.73V58h5.178V41.17l23.86 21.477 3.85-3.464Z"
										clipRule="evenodd"
									/>
								</g>
								<path
									fill="#fff"
									d="m94.071 42-1.506-4.397H81.898L80.392 42h-5.985l10.097-28.499h5.455L100.097 42h-6.026ZM83.69 32.23h7.085l-3.502-10.342h-.081L83.689 32.23Zm39.629-13.192h-6.554v17.425h6.554V42h-19.175v-5.537h6.595V19.038h-6.595v-5.537h19.175v5.537Z"
								/>
								<path
									fill="#CACACA"
									d="M129.197 42V12.28h4.885v10.056h.082c1.262-1.588 3.42-2.524 5.74-2.524 4.845 0 8.061 3.297 8.061 8.06V42h-4.885V28.931c0-2.89-1.629-4.56-4.438-4.56-2.809 0-4.56 1.792-4.56 4.56V42h-4.885Zm22.245-10.789c0-6.717 4.194-11.4 10.056-11.4 5.985 0 9.975 4.56 9.975 11.156v1.67h-15.104c.162 3.46 2.157 5.74 5.211 5.74 2.402 0 4.03-1.059 5.659-3.542l3.582 2.605c-1.954 3.42-5.129 5.17-9.241 5.17-5.985 0-10.138-4.6-10.138-11.399Zm4.967-2.157h10.219c-.163-3.054-2.036-5.008-5.089-5.008-2.809 0-4.967 2.117-5.13 5.008ZM175.117 42V20.422h4.601v1.873h.081c.937-1.425 2.565-2.28 4.56-2.28.977 0 1.832.122 2.606.367l-.855 4.763c-.896-.244-1.669-.366-2.321-.366-2.524 0-3.786 1.71-3.786 5.13V42h-4.886Zm12.465-10.789c0-6.799 4.275-11.4 10.463-11.4 6.229 0 10.504 4.601 10.504 11.4 0 6.8-4.275 11.4-10.504 11.4-6.188 0-10.463-4.6-10.463-11.4Zm16.082 0c0-4.274-2.077-6.92-5.619-6.92-3.46 0-5.577 2.564-5.577 6.92 0 4.357 2.117 6.921 5.577 6.921 3.542 0 5.619-2.646 5.619-6.92Z"
								/>
								<defs>
									<clipPath id="a">
										<path fill="#fff" d="M0 0h58v58H0z" />
									</clipPath>
								</defs>
							</svg>
						}
					>
						<Logo className="text-foreground flex scale-150 items-center justify-center" />
					</LogoAsset>
					<LogoAsset className="bg-background" asset={<LogoMark />}>
						<LogoMark className="text-foreground w-16" />
					</LogoAsset>
				</article>
			</main>
		</LayoutClient>
	)
}
