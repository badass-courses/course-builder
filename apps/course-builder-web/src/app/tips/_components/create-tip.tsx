import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

import { NewResourceWithVideoForm } from './new-resource-with-video-form'

export function CreateTip() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
      <CardContent>
        <NewResourceWithVideoForm />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
