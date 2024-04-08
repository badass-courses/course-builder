export function getBulkDiscountPercent(quantity: number) {
	switch (true) {
		case quantity <= 4:
			return 0
		case quantity <= 9:
			return 0.05
		case quantity <= 29:
			return 0.1
		case quantity <= 49:
			return 0.15
		case quantity <= 79:
			return 0.25
		case quantity <= 99:
			return 0.35
		case quantity >= 100:
			return 0.45
		default:
			return 0
	}
}
