import { Suspense } from 'react'
import Image from 'next/image'
import { Metadata } from 'next/types'
import { Email } from '@/app/(email-list)/_components/email'
import { Signature } from '@/app/(email-list)/_components/signature'
import LayoutClient from '@/components/layout-client'

export const metadata: Metadata = {
	title: 'Confirm your subscription',
}

export default async function ConfirmSubscriptionPage() {
	return (
		<LayoutClient withContainer>
			<main className="min-h-(--pane-layout-height) container flex flex-grow flex-col items-center justify-center px-5 py-24">
				<div className="flex w-full max-w-4xl flex-col items-center justify-center text-center font-light">
					<div className="w-full max-w-[124px] sm:max-w-[164px] md:max-w-[204px]">
						<svg
							width="100%"
							height="auto"
							viewBox="0 0 446 895"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="aspect-446/895"
							aria-hidden="true"
						>
							<path
								d="M278.5 771.5V834.5C278.5 848.859 290.141 860.5 304.5 860.5C318.859 860.5 330.5 848.859 330.5 834.5V771.5C330.5 757.141 318.859 745.5 304.5 745.5C290.141 745.5 278.5 757.141 278.5 771.5Z"
								fill="#AF7128"
								stroke="black"
								stroke-width="6"
							/>
							<path
								d="M302.674 847.205C302.674 845.548 301.331 844.205 299.674 844.205C298.017 844.205 296.674 845.548 296.674 847.205H302.674ZM302.674 859.205V847.205H296.674V859.205H302.674ZM315.34 847.205C315.34 845.548 313.996 844.205 312.34 844.205C310.683 844.205 309.34 845.548 309.34 847.205H315.34ZM315.34 859.205V847.205H309.34V859.205H315.34Z"
								fill="black"
							/>
							<path
								d="M256.653 572.433C248.081 558.25 249.905 539.554 262.132 527.327C276.52 512.94 299.863 512.957 314.272 527.365C324.425 537.518 327.432 552.107 323.289 564.874C336.36 568.791 348.679 575.914 359.007 586.243L373.17 600.405C383.452 610.688 390.558 622.942 394.486 635.947C407.23 631.849 421.773 634.866 431.901 644.995C446.31 659.403 446.327 682.747 431.939 697.135C419.761 709.313 401.166 711.171 387.005 702.716C383.332 709.152 378.75 715.21 373.258 720.701L326.193 767.767L248.61 845.35C246.633 847.327 244.887 849.521 243.404 851.891L227.643 877.088C224.437 882.213 220.893 887.552 215.259 889.743C207.369 892.811 198.061 891.155 191.684 884.778L178.569 872.931L171.165 866.072L162.16 856.832C153.556 848.228 156.326 836.624 161.145 826.223L174.459 803.162C172.411 801.755 169.748 798.468 167.939 796.659C166.376 795.096 164.889 791.872 163.627 790.128L148.298 811.3C141.786 819.718 128.057 821.152 119.453 812.547L93.25 787.024C84.646 778.42 77.7864 765.972 88.273 750.254L134.623 690.243C133.789 687.54 133.339 684.668 133.337 681.692L133.291 618.646C133.279 602.618 146.263 589.634 162.291 589.646C178.319 589.658 191.321 602.66 191.333 618.688L191.344 633.522L238.711 586.155C244.191 580.675 250.233 576.101 256.653 572.433Z"
								fill="#AF7128"
							/>
							<path
								d="M326.193 767.767L373.258 720.701C378.75 715.21 383.332 709.152 387.005 702.716C401.166 711.171 419.761 709.313 431.939 697.135C446.327 682.747 446.31 659.403 431.901 644.995C421.773 634.866 407.23 631.849 394.486 635.947C390.558 622.942 383.452 610.688 373.17 600.405L359.007 586.243C348.679 575.914 336.36 568.791 323.289 564.874C327.432 552.107 324.425 537.518 314.272 527.365C299.863 512.957 276.52 512.94 262.132 527.327C249.905 539.554 248.081 558.25 256.653 572.433C250.233 576.101 244.191 580.675 238.711 586.155L191.344 633.522L191.333 618.688C191.321 602.66 178.319 589.658 162.291 589.646C146.263 589.634 133.279 602.618 133.291 618.646L133.337 681.692C133.339 684.668 133.789 687.54 134.623 690.243L88.273 750.254C77.7864 765.972 84.646 778.42 93.25 787.024L119.453 812.547C128.057 821.152 141.786 819.718 148.298 811.3L163.627 790.128C164.889 791.872 166.376 795.096 167.939 796.659C169.748 798.468 172.411 801.755 174.459 803.162L161.145 826.223C156.326 836.624 153.556 848.228 162.16 856.832L171.165 866.072L178.569 872.931L191.684 884.778C198.061 891.155 207.369 892.811 215.259 889.743C220.893 887.552 224.437 882.213 227.643 877.088L243.404 851.891C244.887 849.521 246.633 847.327 248.61 845.35L288.425 805.535"
								stroke="black"
								stroke-width="6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M162.783 604.187C162.784 605.844 164.128 607.188 165.785 607.189C167.442 607.191 168.784 605.848 168.783 604.192L162.783 604.187ZM162.774 592.178L162.783 604.187L168.783 604.192L168.774 592.183L162.774 592.178ZM150.676 604.178C150.677 605.835 152.021 607.179 153.678 607.181C155.335 607.182 156.677 605.84 156.676 604.183L150.676 604.178ZM150.667 592.17L150.676 604.178L156.676 604.183L156.667 592.174L150.667 592.17Z"
								fill="black"
							/>
							<path
								d="M292.738 601.92L355.317 664.499L345.948 673.868L283.369 611.289L292.738 601.92Z"
								fill="#56BE67"
							/>
							<path
								fill-rule="evenodd"
								clip-rule="evenodd"
								d="M401.156 652.094C403.682 674.976 394.729 698.203 380.335 712.597L336.68 668.942C346.284 659.215 346.246 643.545 336.566 633.865L323.372 620.671C313.692 610.991 298.022 610.953 288.295 620.557L244.855 577.117C259.249 562.723 282.476 553.77 305.358 556.296C328.239 558.821 351.187 570.333 369.153 588.299C387.119 606.265 398.631 629.213 401.156 652.094Z"
								fill="black"
							/>
							<path
								d="M327.383 707.973C330.543 711.133 335.662 711.136 338.817 707.981C341.972 704.826 341.969 699.707 338.809 696.547C335.649 693.387 330.53 693.384 327.375 696.539C324.22 699.694 324.223 704.813 327.383 707.973Z"
								fill="black"
							/>
							<path
								d="M250.489 631.079C253.649 634.239 258.768 634.242 261.923 631.087C265.078 627.932 265.075 622.813 261.915 619.653C258.755 616.493 253.636 616.49 250.481 619.645C247.326 622.8 247.329 627.919 250.489 631.079Z"
								fill="black"
							/>
							<path
								d="M299.046 688.863C293.241 694.669 279.719 694.215 271.946 686.442C264.173 678.669 263.719 665.147 269.525 659.341C275.33 653.536 285.196 657.646 292.969 665.419C300.742 673.192 304.852 683.058 299.046 688.863Z"
								fill="black"
							/>
							<path
								d="M181.373 854.873L172.888 863.358M198.369 871.869L189.883 880.354M108.435 781.935L99.95 790.42M125.43 798.93L116.945 807.415"
								stroke="black"
								stroke-width="6"
								stroke-linecap="round"
							/>
							<path
								d="M177.5 720.5L172.5 344.5"
								stroke="black"
								stroke-width="5"
								stroke-linecap="round"
							/>
							<path
								d="M172.5 341.5C265.836 341.5 341.5 265.836 341.5 172.5C341.5 79.1639 265.836 3.5 172.5 3.5C79.1639 3.5 3.5 79.1639 3.5 172.5C3.5 265.836 79.1639 341.5 172.5 341.5Z"
								fill="#47733D"
								fill-opacity="0.5"
								stroke="#56BE67"
								stroke-width="6"
							/>
							<path
								d="M135.119 41.7383C108.612 49.3158 85.033 64.7707 67.5092 86.054C49.9853 107.337 39.3435 133.443 36.9946 160.912"
								stroke="white"
								stroke-opacity="0.75"
								stroke-width="30"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M156.5 343.5H188L197.5 363.5H147.5L156.5 343.5Z"
								fill="#47733D"
								fill-opacity="0.5"
								stroke="#56BE67"
								stroke-width="6"
								stroke-linejoin="round"
							/>
							<path
								d="M131 656L193 614"
								stroke="black"
								stroke-width="6"
								stroke-linecap="round"
							/>
						</svg>
					</div>

					<h1 className="font-text font-heading mx-auto w-full max-w-lg py-8 text-3xl font-extrabold sm:text-5xl">
						Confirm your email address
					</h1>
					<div className="prose sm:prose-lg prose-p:text-balance mx-auto leading-relaxed opacity-80">
						<p>
							We sent an email to{' '}
							<Suspense>
								<Email />
							</Suspense>{' '}
							with a confirmation link. Click the link to finish your
							subscription.
						</p>
						<p>
							Didn&apos;t get an email? Check your spam folder or other filters
							and add <strong>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</strong>{' '}
							to your contacts.
						</p>
						<p>
							Thanks, <br />
							<Signature />
						</p>
					</div>
				</div>
				{/* <Image
				src={require('../../../../public/assets/bg-text-1@2x.jpg')}
				fill
				alt=""
				aria-hidden="true"
				className="-z-10 object-cover object-center md:object-contain"
			/> */}
			</main>
		</LayoutClient>
	)
}
