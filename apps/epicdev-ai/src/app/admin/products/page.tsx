import { ProductsPage } from '@/app/(commerce)/products/page'

export default function AdminProductsPage() {
	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<ProductsPage />
			</div>
		</main>
	)
}
