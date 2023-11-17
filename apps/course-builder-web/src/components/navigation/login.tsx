'use client'

import Link from "next/link";
import {cn} from "@/lib/utils";
import * as React from "react";
import {usePathname} from "next/navigation";
import {useSession} from "next-auth/react";

export function Login({className}: {className?: string}) {
  const pathname = usePathname()
  const {data: sessionData, status: sessionStatus} = useSession()
  const isLoadingUserInfo = sessionStatus === 'loading'

  return (
    <>
      {isLoadingUserInfo || sessionData?.user?.email ? null : (
        <Link
          href="/login"
          className={cn(
            'group flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition hover:opacity-100',
            {
              'underline opacity-100': pathname === '/login',
              'opacity-75': pathname !== '/login',
            },
            className,
          )}
        >
          Log in
        </Link>
      )}
    </>
  )
}