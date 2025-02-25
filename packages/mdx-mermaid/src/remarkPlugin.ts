import type { Root, RootContent } from 'mdast'
import type { Plugin } from 'unified'
import type { Node } from 'unist'
import { visit } from 'unist-util-visit'

const COMPONENT_NAME = 'Mermaid'

interface MdxJsxAttribute {
	type: 'mdxJsxAttribute'
	name: string
	value: string
}

interface MdxJsxFlowElement {
	type: 'mdxJsxFlowElement'
	name: string
	attributes: MdxJsxAttribute[]
	children: []
}

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

const MERMAID_IMPORT: MdxjsEsm = {
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
}

interface MermaidNode extends Node {
	type: 'code'
	lang: string
	value: string
}

interface Parent extends Node {
	children: Array<RootContent>
}

const remarkMermaid: Plugin<[], Root> = function () {
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

				// Create the MDX component node
				const mdxNode: MdxJsxFlowElement = {
					type: 'mdxJsxFlowElement',
					name: COMPONENT_NAME,
					attributes: [
						{
							type: 'mdxJsxAttribute',
							name: 'chart',
							value: (node as MermaidNode).value,
						},
					],
					children: [],
				}

				// Replace the code block with the MDX component
				parent.children.splice(index, 1, mdxNode as unknown as RootContent)
			}
		})

		// Add the import if we found mermaid nodes
		if (hasMermaidNodes) {
			tree.children.unshift(MERMAID_IMPORT as unknown as RootContent)
		}

		return tree
	}
}

export { remarkMermaid }
