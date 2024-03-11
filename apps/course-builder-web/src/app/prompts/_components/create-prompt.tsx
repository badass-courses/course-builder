import { NewPromptForm } from '@/app/prompts/_components/new-prompt-form'

import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

export function CreatePrompt() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
      <CardContent>
        <NewPromptForm />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
