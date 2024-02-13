import { Login } from '@/components/login'
import { authOptions } from '@/server/auth'

export default function LoginPage() {
  const providers = authOptions.providers
  return (
    <Login
      providers={providers.map((provider) => {
        return {
          id: provider.id,
          name: provider.name,
        }
      })}
    />
  )
}
