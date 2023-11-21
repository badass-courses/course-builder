import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card'
import {NewTipForm} from './new-tip-form'

export function CreateTip() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <svg
          className=" h-4 w-4 text-zinc-500 dark:text-zinc-400"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      </CardHeader>
      <CardContent>
        <NewTipForm />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
