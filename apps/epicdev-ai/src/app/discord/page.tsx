import * as React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ContributorImage } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { getProviders } from '@/server/auth'

import { DiscordConnectButton } from './discord-connect-button'

export const metadata: Metadata = {
	title: 'Join Epic AI Discord',
	description: 'Join Epic AI Discord',
	openGraph: {
		images: [
			{
				url: `${process.env.NEXT_PUBLIC_URL}/api/og/default?title=Join%20Epic%20AI%20Discord`,
			},
		],
	},
}

export default async function Discord() {
	await headers()

	const providers = getProviders()

	const discordProvider = providers?.discord

	return (
		<LayoutClient withContainer>
			<div className="container">
				<div className="text-text absolute left-0 top-0 mx-auto flex min-h-screen w-screen max-w-full flex-col justify-center px-5 sm:px-6 lg:px-8">
					<div className="bg-background flex flex-col justify-center rounded-lg border border-gray-200 p-8 align-middle shadow-xl sm:mx-auto sm:w-full sm:max-w-md">
						{/* prettier-ignore */}
						<svg className='mb-4 mx-auto text-primary dark:text-white' xmlns='http://www.w3.org/2000/svg' width='46'
                 height='46' viewBox='0 0 46 46'>
              <g fill='currentColor' transform='translate(3)'>
                <path
                  d='M15.8628571,19.1771429 C14.56,19.1771429 13.5314286,20.32 13.5314286,21.7142857 C13.5314286,23.1085714 14.5828571,24.2514286 15.8628571,24.2514286 C17.1657143,24.2514286 18.1942857,23.1085714 18.1942857,21.7142857 C18.2171429,20.32 17.1657143,19.1771429 15.8628571,19.1771429 Z M24.2057143,19.1771429 C22.9028571,19.1771429 21.8742857,20.32 21.8742857,21.7142857 C21.8742857,23.1085714 22.9257143,24.2514286 24.2057143,24.2514286 C25.5085714,24.2514286 26.5371429,23.1085714 26.5371429,21.7142857 C26.5371429,20.32 25.5085714,19.1771429 24.2057143,19.1771429 Z' />
                <path
                  d='M35.3142857,0 L4.68571429,0 C2.10285714,0 0,2.10285714 0,4.70857143 L0,35.6114286 C0,38.2171429 2.10285714,40.32 4.68571429,40.32 L30.6057143,40.32 L29.3942857,36.0914286 L32.32,38.8114286 L35.0857143,41.3714286 L40,45.7142857 L40,4.70857143 C40,2.10285714 37.8971429,0 35.3142857,0 Z M26.4914286,29.8514286 C26.4914286,29.8514286 25.6685714,28.8685714 24.9828571,28 C27.9771429,27.1542857 29.12,25.28 29.12,25.28 C28.1828571,25.8971429 27.2914286,26.3314286 26.4914286,26.6285714 C25.3485714,27.1085714 24.2514286,27.4285714 23.1771429,27.6114286 C20.9828571,28.0228571 18.9714286,27.9085714 17.2571429,27.5885714 C15.9542857,27.3371429 14.8342857,26.9714286 13.8971429,26.6057143 C13.3714286,26.4 12.8,26.1485714 12.2285714,25.8285714 C12.16,25.7828571 12.0914286,25.76 12.0228571,25.7142857 C11.9771429,25.6914286 11.9542857,25.6685714 11.9314286,25.6457143 C11.52,25.4171429 11.2914286,25.2571429 11.2914286,25.2571429 C11.2914286,25.2571429 12.3885714,27.0857143 15.2914286,27.9542857 C14.6057143,28.8228571 13.76,29.8514286 13.76,29.8514286 C8.70857143,29.6914286 6.78857143,26.3771429 6.78857143,26.3771429 C6.78857143,19.0171429 10.08,13.0514286 10.08,13.0514286 C13.3714286,10.5828571 16.5028571,10.6512386 16.5028571,10.6512386 L16.7314286,10.9257143 C12.6171429,12.1142857 10.72,13.92 10.72,13.92 C10.72,13.92 11.2228571,13.6457143 12.0685714,13.2571429 C14.5142857,12.1828571 16.4571429,11.8857143 17.2571429,11.8171429 C17.3942857,11.7942857 17.5085714,11.7714286 17.6457143,11.7714286 C19.04,11.5885714 20.6171429,11.5428571 22.2628571,11.7257143 C24.4342857,11.9771429 26.7657143,12.6171429 29.1428571,13.92 C29.1428571,13.92 27.3371429,12.2057143 23.4514286,11.0171429 L23.7714286,10.6512386 C23.7714286,10.6512386 26.9028571,10.5828571 30.1942857,13.0514286 C30.1942857,13.0514286 33.4857143,19.0171429 33.4857143,26.3771429 C33.4857143,26.3771429 31.5428571,29.6914286 26.4914286,29.8514286 L26.4914286,29.8514286 Z' />
              </g>
            </svg>
						{discordProvider && (
							<DiscordConnectButton discordProvider={discordProvider} />
						)}
						<p className="pb-6 pt-6">
							You can connect {process.env.NEXT_PUBLIC_SITE_TITLE} to the Epic
							Web Discord. If you aren't already a member, this will add you to
							the server immediately.
						</p>
						<p className="pb-6">
							If you don't already have a Discord account, you will have the
							chance to make one before being added to the Epic Web Discord
							server.
						</p>
					</div>
				</div>
			</div>
		</LayoutClient>
	)
}
