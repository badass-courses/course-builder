import * as React from 'react'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'

export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
  return <CreateResourcePage resourceType="article" />
}
