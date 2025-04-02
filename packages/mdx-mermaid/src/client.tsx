'use client'

import React from 'react'

/**
 * Configuration options for Mermaid diagrams
 * @interface MermaidConfig
 */
export interface MermaidConfig {
	/** Custom theme to use (default, dark, forest, neutral) */
	theme?: string
	/** Custom theme variables to override default styling */
	themeVariables?: Record<string, string>
	/** Custom CSS to apply to the diagram */
	themeCSS?: string
	/** Security level for Mermaid (default: 'loose') */
	securityLevel?: 'strict' | 'loose' | 'antiscript'
	/** Additional Mermaid configuration options */
	[key: string]: any
}

/**
 * Props for the Mermaid component
 * @interface MermaidProps
 */
interface MermaidProps {
	/** Mermaid diagram definition */
	chart: string
	/** CSS class name to apply to the container */
	className?: string
	/** Configuration options for the Mermaid diagram */
	config?: MermaidConfig
	/** Whether to enable debug mode */
	debug?: boolean
}

/**
 * Hook to determine if an element is visible in the viewport
 * @param ref - Reference to the element to check
 * @returns boolean indicating if the element is visible
 */
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

/**
 * Parse Mermaid directives from chart definition
 * @param chart - Mermaid chart definition
 * @returns Object containing parsed theme, config, and cleaned chart
 */
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

// Global cache for rendered diagrams
const diagramCache = new Map<string, string>()

/**
 * Mermaid component for rendering Mermaid diagrams in MDX
 *
 * Features:
 * - Automatic light/dark theme detection
 * - Lazy loading of Mermaid library
 * - Intersection observer for performance optimization
 * - Caching of rendered diagrams
 * - Support for inline and global configuration
 *
 * @param props - Component props
 * @returns React component
 */
export function Mermaid({
	chart,
	className = 'py-10 w-full flex bg-background border rounded-lg items-center justify-center',
	config: globalConfig = {},
	debug = false,
}: MermaidProps) {
	const id = React.useId()
	const [svg, setSvg] = React.useState('')
	const containerRef = React.useRef<HTMLDivElement>(null)
	const isVisible = useIsVisible(containerRef as React.RefObject<HTMLElement>)

	// Create a cache key based on the chart content and current theme
	const getCacheKey = React.useCallback((chart: string, isDark: boolean) => {
		return `${chart}:${isDark ? 'dark' : 'light'}`
	}, [])

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

			// Check if we have a cached version of this diagram
			const cacheKey = getCacheKey(cleanChart, isDarkTheme)
			if (diagramCache.has(cacheKey)) {
				if (debug) console.log('Using cached Mermaid diagram:', cacheKey)
				setSvg(diagramCache.get(cacheKey)!)
				return
			}

			const { default: mermaid } = await import('mermaid')

			try {
				// Merge global config with inline config
				const mergedConfig = {
					...globalConfig,
					...(inlineConfig || {}),
					themeVariables: {
						...(globalConfig.themeVariables || {}),
						...(inlineConfig?.themeVariables || {}),
					},
					themeCSS: [globalConfig.themeCSS || '', inlineConfig?.themeCSS || '']
						.filter(Boolean)
						.join('\n'),
				}

				// Debug logging
				if (debug) {
					console.log('Mermaid configuration:', {
						theme: inlineTheme || 'base',
						darkMode: isDarkTheme,
						globalConfig,
						inlineConfig,
						mergedConfig,
					})
				}

				// Create base theme variables based on dark/light mode
				const baseThemeVariables = isDarkTheme
					? {
							// Dark theme colors
							fontFamily: 'inherit',
							fontSize: '16px',
							// Primary colors
							primaryColor: '#FFA947',
							primaryTextColor: '#f3f4f6',
							// primaryBorderColor: '#60a5fa',
							// Secondary colors
							secondaryColor: '#2B2C2D',
							secondaryTextColor: '#f3f4f6',
							secondaryBorderColor: '#6b7280',
							// Tertiary colors
							tertiaryColor: '#374151',
							tertiaryTextColor: '#f3f4f6',
							tertiaryBorderColor: '#151617',
							// Background and text
							background: '#2B2C2D',
							textColor: '#f3f4f6',
							mainBkg: '#2B2C2D',
							nodeBkg: '#2B2C2D',
							// Lines and borders
							lineColor: '#9ca3af',
							border1: '#151617',
							border2: '#374151',
							arrowheadColor: '#9ca3af',
							// Note styling
							noteBkgColor: '#151617',
							noteTextColor: '#f3f4f6',
							noteBorderColor: '#6b7280',
							// Error styling
							errorBkgColor: '#ef4444',
							errorTextColor: '#f3f4f6',
							// Flowchart specific
							nodeBorder: '#4D4D4D',
							clusterBkg: '#151617',
							clusterBorder: '#151617',
							defaultLinkColor: '#9ca3af',
							titleColor: '#f3f4f6',
							edgeLabelBackground: '#050505',
							nodeTextColor: '#f3f4f6',
						}
					: {
							// Light theme colors
							fontFamily: 'inherit',
							fontSize: '16px',
							// Primary colors
							primaryColor: '#EA580C',
							primaryTextColor: '#111827',
							primaryBorderColor: '#EA580C',
							// Secondary colors
							secondaryColor: '#e5e7eb',
							secondaryTextColor: '#111827',
							secondaryBorderColor: '#d1d5db',
							// Tertiary colors
							tertiaryColor: '#f3f4f6',
							tertiaryTextColor: '#111827',
							tertiaryBorderColor: '#e5e7eb',
							// Background and text
							background: '#ffffff',
							textColor: '#111827',
							mainBkg: '#ffffff',
							nodeBkg: '#ffffff',
							// Lines and borders
							lineColor: '#4b5563',
							border1: '#e5e7eb',
							border2: '#f3f4f6',
							arrowheadColor: '#4b5563',
							// Note styling
							noteBkgColor: '#fff5ad',
							noteTextColor: '#333333',
							noteBorderColor: '#e6dd80',
							// Error styling
							errorBkgColor: '#fecaca',
							errorTextColor: '#b91c1c',
							// Flowchart specific
							nodeBorder: '#4b5563',
							clusterBkg: '#f3f4f6',
							clusterBorder: '#e5e7eb',
							defaultLinkColor: '#4b5563',
							titleColor: '#111827',
							edgeLabelBackground: '#ffffff',
							nodeTextColor: '#111827',
						}

				// Combine base theme variables with custom theme variables
				const finalThemeVariables = {
					...baseThemeVariables,
					...(mergedConfig.themeVariables || {}),
				}

				if (debug) {
					console.log('Final theme variables:', finalThemeVariables)
				}

				// Create a copy of mergedConfig without themeVariables to prevent overriding
				const {
					themeVariables: _,
					themeCSS: __,
					...restMergedConfig
				} = mergedConfig

				mermaid.initialize({
					startOnLoad: false,
					theme: inlineTheme || 'base',
					securityLevel: 'loose',
					fontFamily: 'inherit',
					darkMode: isDarkTheme,
					flowchart: {
						padding: 20,
						diagramPadding: 20,
						rankSpacing: 60,
					},
					themeVariables: finalThemeVariables,
					themeCSS: `
						.node rect, .node circle, .node polygon, .node path {
							stroke-width: 2px;
							}
							.node.current rect, .node.current circle, .node.current polygon {
							filter: brightness(120%);
						}
						.node rect {
						}
						.edgeLabel {	
						border-radius: 4px;
						}
						.cluster rect {
							rx: 10;
							ry: 10;
						}
						.edgeLabel foreignObject {
							text-align: center;
							
							}
						.edgeLabel foreignObject > div {
							
						}
						.edgeLabel foreignObject > div > span > p {
							border-radius: 4px;
								padding: 2px 10px;
							
							
						}
						${mergedConfig.themeCSS || ''}
					`,
					...restMergedConfig,
				})

				const { svg: renderedSvg } = await mermaid.render(
					id.replace(/[^a-zA-Z0-9]/g, ''),
					cleanChart,
					containerRef.current || undefined,
				)

				// Cache the rendered SVG
				diagramCache.set(cacheKey, renderedSvg)
				if (debug) console.log('Cached Mermaid diagram:', cacheKey)

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
	}, [chart, id, isVisible, globalConfig, debug, getCacheKey])

	return (
		<div
			ref={containerRef}
			className={className}
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	)
}
