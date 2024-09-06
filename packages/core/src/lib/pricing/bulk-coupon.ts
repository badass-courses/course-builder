export function getBulkDiscountPercent(quantity: number) {
	switch (true) {
		case quantity <= 4:
			return 0
		case quantity <= 9:
			return 0.15
		case quantity <= 29:
			return 0.25
		default:
			return 0.35
	}
}
