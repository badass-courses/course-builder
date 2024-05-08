export function convertToSerializeForNextResponse(result: any) {
	for (const resultKey in result) {
		if (result[resultKey] instanceof Date) {
			result[resultKey] = result[resultKey].toISOString()
		} else if (
			result[resultKey]?.constructor?.name === 'Decimal' ||
			result[resultKey]?.constructor?.name === 'i'
		) {
			result[resultKey] = result[resultKey].toNumber()
		} else if (result[resultKey]?.constructor?.name === 'BigInt') {
			result[resultKey] = Number(result[resultKey])
		} else if (result[resultKey] instanceof Object) {
			result[resultKey] = convertToSerializeForNextResponse(result[resultKey])
		}
	}

	return result
}
