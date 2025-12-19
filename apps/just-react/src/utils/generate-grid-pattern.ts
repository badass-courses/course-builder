// Add caching for grid patterns
const patternCache = new Map<string, string>()

export function generateGridPattern(
	seed: string,
	width = 1200,
	height = 800,
	SCALE = 1.75,
	withEffect = false,
) {
	const rand = mulberry32(hashCode(seed))

	const squareSize = 50 * SCALE // Adjust as needed

	const cols = Math.ceil(width / squareSize)
	const rows = Math.ceil(height / squareSize)

	let svgElements = ''

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const x = col * squareSize
			const y = row * squareSize

			// Generate square outline
			const squarePath = generateSquarePath(x, y, squareSize)
			svgElements += `<path d="${squarePath}" stroke="#524C46" stroke-width="2" fill="none" />`

			const shapes: string[] = [
				'M6 6h14v11h-6.8v-5.2h2V15H18V8H8v15h32V8H30v7h2.8v-3.2h2V17H28V6h14v36H28V31h6.8v5.2h-2V33H30v7h10V25H8v15h10v-7h-2.8v3.2h-2V31H20v11H6V6Z',
				'M7 8h33v32H15.087V16.667h16.826v14.666h-9.087V24h2v5.333h5.087V18.667H17.087V38H38V10H9v38H7V8Z',
				'M48 6H0V4h48v2ZM11.867 23.833v-2H16V18H6.389v14H0v-2h4.39V16H18v7.833h-6.133ZM30 27.5h2V30h8.389V16H48v2h-5.611v14H30v-4.5Zm-18 0V32h12.389V18H34v3.833h-4.133v2H36V16H22.389v14H14v-2.5h-2ZM48 39H0v-2h48v2ZM0 44h48v-2H0v2Zm0-33h48V9H0v2Z',
				'M48 2H0V0h48v2ZM6 48V8H0V6h48v2h-6v40h-2V8h-3.667v40h-2V8h-3.667v40h-2V8H25v40h-2V8h-3.667v40h-2V8h-3.667v40h-2V8H8v40H6Z',
				'M46 2H2v44h44V2ZM0 0v48h48V0H0Zm39 9h-4v30h4V9Zm-6 30v-4h-3v4h3Zm-5 0v-4h-3v4h3Zm-5 0h-3v-4h3v4Zm-8 0h3v-4h-3v4Zm-2 0H9V9h4v30Zm2-6h18V15H15v18Zm3-20h-3V9h3v4Zm2-4v4h3V9h-3Zm8 4h-3V9h3v4Zm2-4v4h3V9h-3ZM7 7v34h34V7H7Zm21 13h-8v8h8v-8Zm-10-2v12h12V18H18Zm4 8v-4h4v4h-4Z',
				'M40 40H7V8h24.913v23.333H15.087V16.667h9.087V24h-2v-5.333h-5.087v10.666h12.826V10H9v28h29V0h2v40Z',
				'M15 0v44h2V0h-2Zm-3 44H4v-8.5h8v4h-2v-2H6V42h6v2Zm24 0h8v-8.5h-8v4h2v-2h4V42h-6v2Zm-17 0V0h2v44h-2Zm4-44v44h2V0h-2Zm4 44V0h2v44h-2Zm4-44v44h2V0h-2ZM4 46h40v2H4v-2Z',
				// 'm43.303 24-5.916-2.784C35.347 20.256 33 21.745 33 24s2.346 3.744 4.387 2.784L43.303 24Zm-5.064-4.594a5.016 5.016 0 0 0-3.665-.258l2.86-8.583-8.582 2.861a5.016 5.016 0 0 0-.258-3.665L24 0l-4.594 9.761a5.016 5.016 0 0 0-.258 3.665l-8.583-2.86 2.861 8.582a5.016 5.016 0 0 0-3.665.258L0 24l9.761 4.594a5.016 5.016 0 0 0 3.665.258l-2.86 8.583 8.582-2.86a5.016 5.016 0 0 0 .258 3.664L24 48l4.594-9.761a5.016 5.016 0 0 0 .258-3.665l8.583 2.861-2.861-8.583c1.148.36 2.44.318 3.665-.258L48 24l-9.761-4.594Zm-3.966 14.867-2.253-6.759c-.838-2.512-4.026-3.265-5.899-1.392-1.872 1.872-1.12 5.06 1.393 5.898l6.759 2.253ZM22.433 24A5.686 5.686 0 0 1 24 25.566 5.686 5.686 0 0 1 25.567 24 5.686 5.686 0 0 1 24 22.434 5.686 5.686 0 0 1 22.434 24Zm5.08-8.02 6.76-2.253-2.254 6.76c-.837 2.512-4.025 3.264-5.898 1.392-1.872-1.873-1.12-5.061 1.393-5.899ZM15.98 27.514l-2.253 6.759 6.76-2.253c2.512-.837 3.264-4.026 1.392-5.898-1.873-1.873-5.061-1.12-5.899 1.392Zm4.506-11.534-6.759-2.253 2.253 6.76c.838 2.512 4.026 3.264 5.899 1.392 1.872-1.873 1.12-5.061-1.393-5.899Zm-9.873 10.804L4.697 24l5.916-2.784C12.653 20.256 15 21.745 15 24s-2.346 3.744-4.387 2.784ZM24 43.303l2.784-5.916C27.744 35.347 26.255 33 24 33s-3.744 2.346-2.784 4.387L24 43.303Zm-2.784-32.69L24 4.697l2.784 5.916C27.744 12.653 26.255 15 24 15s-3.744-2.346-2.784-4.387Z',
				'M44 7H29v30h2V9h13v9h-8v-4h2v2h4v-5h-9v10h11v2H33v16h-6V7H4V5h40v2ZM4 9h8v2H6v5h4v-2.5h2V18H4V9Zm40 30h-8v-2h6v-5h-4v2h-2v-4h8v9Zm-29 0H4v-9h8v4h-2v-2H6v5h9V27H4v-2h11V9h6v32h23v2H4v-2h15V11h-2v28h-2Zm8-30v30h2V9h-2ZM12 23H4v-2h8v2Zm24 4h8v-2h-8v2Z',
				'M22 14h-8v8h8v-8Zm-6 6v-4h4v4h-4Zm6 6h-8v8h8v-8Zm-6 6v-4h4v4h-4Zm10-18h8v8h-8v-8Zm2 2v4h4v-4h-4Zm6 10h-8v8h8v-8Zm-6 6v-4h4v4h-4Z',
				'M44 4H5v40h39V33H16V15h28V4ZM7 42V6h35v7H14v22h28v7H7ZM41 7H8v34h33v-5H13V12h28V7ZM10 39V9h29v1H11v28h28v1H10Z',
				'M1 3h46v9.81L40.366 11H28v29h7v5H12.5v-5H20V11H7.147L1 12.844V3Zm2 2v5.156L6.853 9H22v33h-7.5v1H33v-1h-7V9h14.634L45 10.19V5H3Zm20 1H4v2h19v34h2V8h19V6H23Z',
				'', // empty squares look good
				'',
			]

			const randomShape: any = shapes[Math.floor(rand() * shapes.length)]
			const index = x + y

			// Generate the shape and add it to the SVG elements
			svgElements += generateUserShapeTemplate(
				randomShape,
				x,
				y,
				squareSize,
				rand,
				index,
				SCALE,
				withEffect,
			)
		}
	}

	const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ripple">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="50" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="#040404" />
      ${svgElements}
    </svg>
  `
	const cacheKey = `${seed}-${width}-${height}-${SCALE}-${withEffect}`

	if (patternCache.has(cacheKey)) {
		return patternCache.get(cacheKey)!
	}

	const pattern = `data:image/svg+xml;base64,${btoa(svgContent)}`
	patternCache.set(cacheKey, pattern)
	return pattern
}

function generateSquarePath(x: number, y: number, size: number) {
	const pathData = `M${x},${y} h${size} v${size} h-${size} Z`
	return pathData
}

function generateUserShapeTemplate(
	d: string,
	x: number,
	y: number,
	size: number,
	rand: () => number,
	index: number,
	SCALE: number,
	withEffect = false,
) {
	// Generate the clipping path for the square
	const clipPath = generateSquarePath(0, 0, size)

	// Define available colors and rotations
	const availableColors = ['#524C46', '#7B6B5B', '#E2C4A1', '#7B6B5B']
	// const availableColors = ['#1B1B1B', '#1B1B1B', '#373028']
	const color = availableColors[Math.floor(rand() * availableColors.length)]
	const availableRotations = [
		'rotate(0)',
		// 'rotate(90)',
		// 'rotate(180)',
		// 'rotate(270)',
	]
	const rotation =
		availableRotations[Math.floor(rand() * availableRotations.length)]

	// Transform to position the shape within the square
	const transform = transformCustomShapeFromFigma(size, SCALE)

	return `
    <g clip-path="url(#clip-${index})" transform="translate(${x}, ${y}) ${rotation}" filter="${withEffect ? 'url(#ripple)' : ''}">
      <path fill="${color}" transform="${transform}" fill-rule="evenodd" d="${d}" clip-rule="evenodd"/>
    </g>
    <defs>
      <clipPath id="clip-${index}">
        <path d="${clipPath}" />
      </clipPath>
    </defs>
  `
}

function transformCustomShapeFromFigma(size: number, SCALE: number) {
	const originalSize = 50 * SCALE // Original size from Figma
	const scale = 1 * SCALE

	// Adjust the translation to center the shape within the square
	const translateX = 0 // size - originalSize * scale
	const translateY = 0 // size - originalSize * scale

	return `translate(${translateX}, ${translateY}) scale(${scale})`
}

function hashCode(str: string) {
	let hash = 0
	if (str.length === 0) return hash
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash &= hash // Convert to 32-bit integer
	}
	return hash
}

function base64Encode(str: string) {
	return Buffer.from(str, 'binary').toString('base64')
}

function mulberry32(a: number) {
	return function () {
		var t = (a += 0x6d2b79f5)
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}
