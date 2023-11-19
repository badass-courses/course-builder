'use client'

import LandingCopy from './landing-copy.mdx'
import {Button} from '@/components/ui/button'
import {signIn, useSession} from 'next-auth/react'
import {Icon} from '@/components/icons'

export const Landing = () => {
  const {data: session, status} = useSession()
  console.log(session)
  return (
    <>
      <LandingCopy />
      {status === 'unauthenticated' ? (
        <div className="flex flex-col">
          <h2 className="mb-8 text-xl font-bold text-gray-900 dark:text-gray-100">
            Want to Learn More About Course Builder?
          </h2>
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
            Signup with Github for Updates
          </Button>
        </div>
      ) : null}
    </>
  )
}
