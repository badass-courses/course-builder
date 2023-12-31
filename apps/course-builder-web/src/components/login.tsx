import {Button} from '@coursebuilder/ui'
import {signIn} from 'next-auth/react'
import {Icon} from '@/components/icons'

export function Login({className}: {className?: string}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-gray-100">
        Log In
      </h1>
      <Button
        data-button=""
        variant="outline"
        onClick={() =>
          signIn('github', {
            callbackUrl: '/',
          })
        }
      >
        <Icon
          className="mr-2 flex items-center justify-center"
          name="Github"
          size="20"
        />
        Log in with Github
      </Button>
    </div>
  )
}
