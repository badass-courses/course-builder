import React from 'react'

/**
 * Signature component for certificate rendering - Kent C. Dodds signature.
 */
const Signature = ({ src }: { src: string }) => {
	return (
		<img
			src={src}
			alt="Kent C. Dodds"
			style={{
				width: '200px',
				height: 'auto',
				opacity: 0.8,
			}}
		/>
	)
}

export default Signature
