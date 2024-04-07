import * as React from 'react'

export function Hello() {
	const [hi, setHi] = React.useState('hekko')
	return <div>{hi}</div>
}
