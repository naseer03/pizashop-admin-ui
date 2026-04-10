import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTH_SESSION_COOKIE } from '@/lib/auth-constants'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
  if (!session) {
    redirect('/login')
  }

  return children
}
