'use client'

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pizza } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { setSession } from '@/lib/auth'
import { loginWithEmailPassword } from '@/lib/api/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    if (!trimmed || !password) {
      setError('Enter your email and password.')
      return
    }

    startTransition(async () => {
      const result = await loginWithEmailPassword(trimmed, password)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        email: trimmed,
      })
      const target = redirect.startsWith('/') ? redirect : '/'
      router.push(target)
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Pizza className="h-7 w-7" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            PizzaHub Admin
          </CardTitle>
          <CardDescription>
            Sign in with the email and password from your PizzaHub POS account. API:{' '}
            <span className="text-foreground">pizzaapi.lefruit.in</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                aria-invalid={!!error}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                aria-invalid={!!error}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="underline underline-offset-4 hover:text-foreground">
              Back to dashboard
            </Link>{' '}
            (requires sign-in)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md py-12 shadow-md">
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
