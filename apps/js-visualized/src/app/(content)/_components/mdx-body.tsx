'use client'

import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'

export const MDXBody = ({ source }: { source: MDXRemoteSerializeResult }) => {
	return <MDXRemote {...source} />
}
