export const formatUsd = (amount: number = 0) => {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	})
	const formattedPrice = formatter.format(amount).split('.')

	return { dollars: formattedPrice[0], cents: formattedPrice[1] }
}
