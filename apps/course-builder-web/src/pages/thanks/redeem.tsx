import * as React from 'react'
import { GetServerSideProps } from 'next'
import { courseBuilderAdapter } from '@/db'
import { LoginLink } from '@/path-to-purchase/post-purchase-login-link'

export const getServerSideProps: GetServerSideProps = async (context) => {
	const { query } = context

	const { purchaseId } = query

	const { getPurchaseWithUser } = courseBuilderAdapter

	const purchase = await getPurchaseWithUser(purchaseId as string)

	return {
		props: {
			email: purchase?.user?.email,
		},
	}
}

const ThanksRedeem: React.FC<
	React.PropsWithChildren<{ purchase: any; email: string }>
> = ({ email }) => {
	return (
		<div>
			<main className="flex flex-grow flex-col items-center justify-center px-5 pb-16 pt-5">
				<div className="mx-auto w-full max-w-3xl">
					<h1 className="w-full pb-3 font-semibold uppercase tracking-wide">
						Success!
					</h1>
					<LoginLink email={email} />
				</div>
			</main>
		</div>
	)
}

export default ThanksRedeem
