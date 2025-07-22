import { useState } from 'react'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await signIn.email({
        email,
        password,
        callbackURL: '/documents',
      })

      if (error) {
        console.error(error)
        return
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full">
        Sign In
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          signIn.social({
            provider: 'github',
            callbackURL: '/documents',
          })
        }>
        Sign In with GitHub
      </Button>
    </form>
  )
}
