'use client'

import React from 'react'

interface MermaidProps {
	chart: string
	className?: string
}

function useIsVisible(ref: React.RefObject<HTMLElement>) {
	const [isIntersecting, setIntersecting] = React.useState(false)

	React.useEffect(() => {
		const observer = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) {
				observer.disconnect()
				setIntersecting(true)
			}
		})

		if (ref.current) {
			observer.observe(ref.current)
		}

		return () => {
			observer.disconnect()
		}
	}, [ref])

	return isIntersecting
}

function parseThemeDirective(chart: string) {
	const themeMatch = chart.match(/%%\{.*?theme\s*:\s*([^}\s]+).*?\}%%/)
	const configMatch = chart.match(/%%\{.*?init\s*:\s*({[^}]+}).*?\}%%/)

	return {
		theme: themeMatch?.[1],
		config: configMatch ? JSON.parse(configMatch[1]) : null,
		// Remove directives from chart to prevent double processing
		cleanChart: chart
			.replace(/%%\{.*?theme\s*:.*?\}%%/g, '')
			.replace(/%%\{.*?init\s*:.*?\}%%/g, '')
			.trim(),
	}
}

export function Mermaid({ chart, className = 'my-4 block' }: MermaidProps) {
	const id = React.useId()
	const [svg, setSvg] = React.useState('')
	const containerRef = React.useRef<HTMLDivElement>(null)
	const isVisible = useIsVisible(containerRef as React.RefObject<HTMLElement>)

	React.useEffect(() => {
		if (!isVisible) return

		const htmlElement = document.documentElement
		const observer = new MutationObserver(renderChart)
		observer.observe(htmlElement, { attributes: true })

		void renderChart()

		return () => {
			observer.disconnect()
		}

		async function renderChart() {
			const isDarkTheme =
				htmlElement.classList.contains('dark') ||
				htmlElement.getAttribute('data-theme') === 'dark'

			const {
				theme: inlineTheme,
				config: inlineConfig,
				cleanChart,
			} = parseThemeDirective(chart)

			const { default: mermaid } = await import('mermaid')

			try {
				mermaid.initialize({
					startOnLoad: false,
					theme: inlineTheme || (isDarkTheme ? 'dark' : 'default'),
					securityLevel: 'loose',
					fontFamily: 'inherit',
					darkMode: isDarkTheme,
					themeVariables: {
						...(isDarkTheme
							? {
									// Dark theme colors
									primaryColor: '#3b82f6',
									primaryTextColor: '#f3f4f6',
									primaryBorderColor: '#60a5fa',
									lineColor: '#9ca3af',
									secondaryColor: '#4b5563',
									tertiaryColor: '#374151',
									background: '#1f2937',
									mainBkg: '#1f2937',
									nodeBkg: '#1f2937',
									textColor: '#f3f4f6',
									border1: '#4b5563',
									border2: '#374151',
									arrowheadColor: '#9ca3af',
								}
							: {
									// Light theme colors
									primaryColor: '#3b82f6',
									primaryTextColor: '#111827',
									primaryBorderColor: '#60a5fa',
									lineColor: '#4b5563',
									secondaryColor: '#e5e7eb',
									tertiaryColor: '#f3f4f6',
									background: '#ffffff',
									mainBkg: '#ffffff',
									nodeBkg: '#ffffff',
									textColor: '#111827',
									border1: '#e5e7eb',
									border2: '#f3f4f6',
									arrowheadColor: '#4b5563',
								}),
						...(inlineConfig?.themeVariables || {}),
					},
					themeCSS: `
						.node rect, .node circle, .node polygon, .node path {
							stroke-width: 2px;
						}
						.node.current rect, .node.current circle, .node.current polygon {
							filter: brightness(120%);
						}
						.edgeLabel {
							background-color: ${isDarkTheme ? '#1f2937' : '#ffffff'};
							padding: 4px 8px;
							border-radius: 4px;
						}
						.edgeLabel foreignObject {
							text-align: center;
						}
						${inlineConfig?.themeCSS || ''}
					`,
					...inlineConfig,
				})

				const { svg: renderedSvg } = await mermaid.render(
					id.replace(/[^a-zA-Z0-9]/g, ''),
					cleanChart,
					containerRef.current || undefined,
				)

				setSvg(renderedSvg)
			} catch (error) {
				console.error('Failed to render mermaid chart:', error)
				// Show error in the diagram
				setSvg(`<div class="p-4 border border-red-500 bg-red-50 text-red-700 rounded">
					<p class="font-bold">Mermaid Error:</p>
					<pre class="mt-2 text-sm overflow-auto">${error instanceof Error ? error.message : String(error)}</pre>
				</div>`)
			}
		}
	}, [chart, id, isVisible])

	return (
		<div
			ref={containerRef}
			className={className}
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	)
}
