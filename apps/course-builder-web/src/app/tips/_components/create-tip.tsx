import {Card, CardContent, CardFooter, CardHeader} from '@coursebuilder/ui'
import {NewTipForm} from './new-tip-form'

export function CreateTip() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
      <CardContent>
        <NewTipForm />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
