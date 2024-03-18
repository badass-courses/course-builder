import { CookieOption, CookiesOptions } from '../../types'

export interface Cookie extends CookieOption {
  value: string
}

export function defaultCookies(useSecureCookies: boolean) {
  const cookiePrefix = useSecureCookies ? '__Secure-' : ''
  return {
    // default cookie options
  } as const satisfies CookiesOptions
}
