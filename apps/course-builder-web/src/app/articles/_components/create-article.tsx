import { NewArticleForm } from '@/app/articles/_components/new-article-form'

import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

export function CreateArticle() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
      <CardContent>
        <NewArticleForm />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
