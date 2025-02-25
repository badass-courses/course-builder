import type { Root, RootContent } from 'mdast'
import type { Plugin } from 'unified'
import type { Node } from 'unist'
import { visit } from 'unist-util-visit'

const COMPONENT_NAME = 'Mermaid'

/**
 * Configuration options for the Mermaid remark plugin
 * @interface RemarkMermaidOptions
 */
export interface RemarkMermaidOptions {
	/** Global configuration to pass to all Mermaid components */
	config?: Record<string, any>
	/** Enable debug mode for all Mermaid components */
	debug?: boolean
}

/**
 * MDX JSX attribute node
 * @interface MdxJsxAttribute
 */
interface MdxJsxAttribute {
	type: 'mdxJsxAttribute'
	name: string
	value: string | boolean | number | null
}

/**
 * MDX JSX flow element node
 * @interface MdxJsxFlowElement
 */
interface MdxJsxFlowElement {
	type: 'mdxJsxFlowElement'
	name: string
	attributes: MdxJsxAttribute[]
	children: []
}

/**
 * MDX ESM import node
 * @interface MdxjsEsm
 */
interface MdxjsEsm extends Node {
	type: 'mdxjsEsm'
	value?: string
	data: {
		estree: {
			type: 'Program'
			body: Array<{
				type: 'ImportDeclaration'
				specifiers: Array<{
					type: 'ImportSpecifier'
					imported: { type: 'Identifier'; name: string }
					local: { type: 'Identifier'; name: string }
				}>
				source: { type: 'Literal'; value: string }
			}>
			sourceType: 'module'
		}
	}
}

/**
 * Creates an MDX import statement for the Mermaid component
 * @returns MDX ESM import node
 */
const createMermaidImport = (): MdxjsEsm => ({
	type: 'mdxjsEsm',
	data: {
		estree: {
			type: 'Program',
			body: [
				{
					type: 'ImportDeclaration',
					specifiers: [
						{
							type: 'ImportSpecifier',
							imported: { type: 'Identifier', name: COMPONENT_NAME },
							local: { type: 'Identifier', name: COMPONENT_NAME },
						},
					],
					source: {
						type: 'Literal',
						value: '@coursebuilder/mdx-mermaid/client',
					},
				},
			],
			sourceType: 'module',
		},
	},
})

/**
 * Mermaid code block node
 * @interface MermaidNode
 */
interface MermaidNode extends Node {
	type: 'code'
	lang: string
	value: string
}

/**
 * Parent node with children
 * @interface Parent
 */
interface Parent extends Node {
	children: Array<RootContent>
}

/**
 * Remark plugin for transforming Mermaid code blocks into MDX components
 *
 * This plugin finds code blocks with the 'mermaid' language and transforms them
 * into MDX components that render Mermaid diagrams on the client side.
 *
 * @param options - Configuration options for the plugin
 * @returns Unified transformer function
 */
const remarkMermaid: Plugin<[RemarkMermaidOptions?], Root> = function (
	options = {},
) {
	return (tree: Root) => {
		// Track if we need to add the import
		let hasMermaidNodes = false

		// First pass: find and transform mermaid code blocks
		visit(tree, 'code', (node, index, parent) => {
			if (
				node.type === 'code' &&
				(node as any).lang === 'mermaid' &&
				typeof index === 'number' &&
				parent
			) {
				hasMermaidNodes = true

				// Create attributes for the MDX component
				const attributes: MdxJsxAttribute[] = [
					{
						type: 'mdxJsxAttribute',
						name: 'chart',
						value: (node as MermaidNode).value,
					},
				]

				// Add global configuration if provided
				if (options.config) {
					attributes.push({
						type: 'mdxJsxAttribute',
						name: 'config',
						value: JSON.stringify(options.config),
					})
				}

				// Add debug mode if enabled
				if (options.debug) {
					attributes.push({
						type: 'mdxJsxAttribute',
						name: 'debug',
						value: true,
					})
				}

				// Create the MDX component node
				const mdxNode: MdxJsxFlowElement = {
					type: 'mdxJsxFlowElement',
					name: COMPONENT_NAME,
					attributes,
					children: [],
				}

				// Replace the code block with the MDX component
				parent.children.splice(index, 1, mdxNode as unknown as RootContent)
			}
		})

		// Add the import if we found mermaid nodes
		if (hasMermaidNodes) {
			tree.children.unshift(createMermaidImport() as unknown as RootContent)
		}

		return tree
	}
}

export { remarkMermaid }
