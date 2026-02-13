// Heart shape via implicit equation: (x²+y²-1)³ - x²y³ < 0
// COLS ~2x ROWS to compensate for tall monospace chars

const COLS = 34
const ROWS = 17

function buildHeart(): string {
	const lines: string[] = []
	for (let r = 0; r < ROWS; r++) {
		let line = ''
		for (let c = 0; c < COLS; c++) {
			const x = ((c / (COLS - 1)) * 2 - 1) * 1.2
			const y = (1 - r / (ROWS - 1)) * 2.6 - 1.1

			const v = (x * x + y * y - 1) ** 3 - x * x * y * y * y
			line += v < 0 ? '█' : ' '
		}
		lines.push(line)
	}
	return lines.join('\n')
}

const heart = buildHeart()

export function AsciiHeart({ className = '' }: { className?: string }) {
	return (
		<pre
			className={`select-none font-mono text-[8px] leading-[1.1] text-white/20 ${className}`}
			aria-hidden
		>
			{heart}
		</pre>
	)
}
