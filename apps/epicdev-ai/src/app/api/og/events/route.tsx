import { ImageResponse } from 'next/og'
import { formatInTimeZone } from 'date-fns-tz'

export const runtime = 'edge'
export const revalidate = 60

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const title = searchParams.get('title') || 'MCP Fundamentals'
		const eventsParam = searchParams.get('events')

		// Parse events from URL params
		let upcomingEvents: Array<{
			id: string
			date: string
			timezone: string
			isSoldOut: boolean
		}> = []

		if (eventsParam) {
			try {
				upcomingEvents = JSON.parse(decodeURIComponent(eventsParam))
			} catch (e) {
				console.error('Failed to parse events param:', e)
			}
		}

		const fontData = await fetch(
			new URL(
				'../../../../../public/fonts/VastagoGrotesk-Bold.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-linear-to-tr from-purple-200 to-white flex-row"
					style={{
						fontFamily: 'HeadingFont',
						background: '#EFEFFD',
						color: '#1D0F42',
						width: 1200,
						height: 630,
					}}
				>
					{/* Left side - Logo and Title */}
					<div tw="flex flex-col justify-between p-24 w-1/2">
						<div tw="flex items-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={153 * 1.5}
								height={60 * 1.5}
								fill="none"
								viewBox="0 0 153 60"
							>
								<path
									fill="url(#a)"
									d="M40.994 28.857c.457-.726-.054-1.668-.888-1.668H30.084a1.076 1.076 0 0 1-1.01-1.448L37.82 2.066c.457-1.21-1.21-2.045-1.91-.969L10.947 39.133c-.457.726.054 1.667.888 1.667h9.634c.937 0 1.587.934 1.261 1.813l-1.933 5.221c-1.086 2.932-4.417 4.477-6.935 2.625-5.062-3.723-8.348-9.71-8.348-16.464 0-10.58 8.088-19.313 18.435-20.344a1.11 1.11 0 0 0 .82-.488l2.205-3.347a.532.532 0 0 0-.421-.827c-.188-.006-.377-.01-.569-.01C11.862 8.979.43 20.734.994 34.99c.444 11.416 8.64 20.938 19.45 23.403a1.551 1.551 0 0 0 1.635-.68l18.942-28.856h-.027Z"
								/>
								<path
									fill="#1D0F42"
									d="M37.707 11.961a.534.534 0 0 0-.785.268l-1.12 3.058a.83.83 0 0 0 .372 1c6.12 3.539 10.253 10.157 10.253 17.708 0 7.605-7.975 19.044-18.17 20.312a1.718 1.718 0 0 0-1.232.743l-1.901 2.886c-.319.484-.039 1.132.538 1.185C36.852 60.144 51 48.333 51 33.995c0-7.163-2.857-15.469-13.293-22.034Zm37.07 12.469v3.244h-8.97v4.42h8.656v3.19h-8.657v4.473h9.18V43H61.988V24.43h12.789Zm3.272 4.709h3.61l.104 2.876-.288-.261c.332-.942.872-1.665 1.622-2.17.767-.507 1.683-.76 2.746-.76 1.273 0 2.354.323 3.243.968.907.628 1.587 1.491 2.04 2.59.453 1.08.68 2.31.68 3.687 0 1.378-.227 2.616-.68 3.714-.453 1.081-1.133 1.944-2.04 2.59-.89.627-1.97.94-3.243.94-.68 0-1.308-.113-1.883-.34a4.146 4.146 0 0 1-1.49-.993 5.013 5.013 0 0 1-.995-1.648l.34-.209v6.8H78.05V29.138Zm3.505 6.93c0 .802.113 1.526.34 2.171.244.645.601 1.168 1.072 1.57.488.383 1.081.575 1.779.575 1.028 0 1.813-.41 2.353-1.23.541-.82.811-1.848.811-3.086 0-1.22-.279-2.24-.837-3.06-.54-.837-1.316-1.255-2.327-1.255-.698 0-1.29.2-1.779.601-.47.384-.828.907-1.072 1.57-.227.645-.34 1.36-.34 2.144Zm16.659-6.93V43h-3.766V29.139h3.766Zm.078-4.708v2.877h-3.897V24.43h3.897Zm12.509 9.964c-.105-.837-.419-1.482-.942-1.935-.505-.453-1.116-.68-1.831-.68-1.011 0-1.795.375-2.353 1.125-.541.75-.811 1.804-.811 3.164s.27 2.415.811 3.165c.558.75 1.342 1.124 2.353 1.124.75 0 1.378-.235 1.884-.706.523-.47.845-1.15.967-2.04l3.897.157c-.122 1.116-.488 2.093-1.098 2.93-.611.836-1.413 1.482-2.406 1.935-.977.453-2.058.68-3.244.68-1.412 0-2.65-.297-3.713-.89a6.056 6.056 0 0 1-2.459-2.536c-.575-1.099-.863-2.372-.863-3.819s.288-2.72.863-3.818a6.056 6.056 0 0 1 2.459-2.537c1.063-.593 2.301-.89 3.713-.89 1.151 0 2.215.219 3.191.654.977.436 1.761 1.064 2.354 1.883.61.803.976 1.744 1.099 2.825l-3.871.21Zm16.846-9.964h3.609L136.852 43h-3.687l-3.714-13.077L125.737 43h-3.688l5.597-18.57Zm-2.066 14.855 1.255-2.85h5.257l1.229 2.85h-7.741Zm25.542-11.638h-4.211v12.135h4.29V43h-12.136v-3.217h4.289V27.648h-4.21V24.43h11.978v3.217Z"
								/>
								<defs>
									<linearGradient
										id="a"
										x1=".983"
										x2="41.182"
										y1="29.61"
										y2="29.61"
										gradientUnits="userSpaceOnUse"
									>
										<stop stopColor="#7C56D0" />
										<stop offset="1" stopColor="#7E7DDD" />
									</linearGradient>
								</defs>
							</svg>
						</div>

						<div tw="flex flex-col">
							<div tw="text-6xl font-semibold leading-tight text-[#1D0F42] max-w-[500px]">
								{title}
							</div>
						</div>
					</div>

					{/* Right side - Upcoming Events */}
					<div tw="flex flex-col p-16 w-1/2 justify-center">
						<div tw="flex flex-col h-full bg-white/80 rounded-2xl  shadow-xl">
							<div tw="flex flex-col px-8 py-2 mb-2 border-b border-gray-200 rounded-t-2xl">
								<h3 tw="text-3xl font-semibold text-[#1D0F42]">
									Upcoming Dates
								</h3>
							</div>

							{upcomingEvents.length > 0 ? (
								<div tw="flex flex-col px-8 py-4">
									{upcomingEvents.slice(0, 4).map((event, index) => {
										return (
											<div key={event.id} tw="flex flex-col pt-4">
												<div tw="flex items-center">
													{/* Calendar icon */}
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="24"
														height="24"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#7C56D0"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<rect
															x="3"
															y="4"
															width="18"
															height="18"
															rx="2"
															ry="2"
														/>
														<line x1="16" y1="2" x2="16" y2="6" />
														<line x1="8" y1="2" x2="8" y2="6" />
														<line x1="3" y1="10" x2="21" y2="10" />
													</svg>

													<div tw="text-2xl ml-3 font-medium text-[#1D0F42] mt-1">
														{formatInTimeZone(
															new Date(event.date),
															event.timezone,
															'EEEE, MMMM d, yyyy',
														)}
													</div>
													{event.isSoldOut && (
														<div tw="flex-shrink-0 bg-[#7C56D0] ml-3 text-white text-base px-2 py-1 rounded">
															Sold Out
														</div>
													)}
												</div>

												{index < Math.min(upcomingEvents.length, 4) - 1 && (
													<div tw="border-t border-gray-200 mt-4" />
												)}
											</div>
										)
									})}
								</div>
							) : (
								<div tw="flex flex-col items-center text-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#7C56D0"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
										<line x1="16" y1="2" x2="16" y2="6" />
										<line x1="8" y1="2" x2="8" y2="6" />
										<line x1="3" y1="10" x2="21" y2="10" />
									</svg>
									<div tw="text-base text-[#1D0F42] mt-2">
										Join waitlist for updates
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			),
			{
				fonts: [
					{
						name: 'HeadingFont',
						data: fontData,
						style: 'normal',
					},
				],
				debug: false,
			},
		)
	} catch (e: any) {
		return new Response('Failed to generate OG image', { status: 500 })
	}
}
