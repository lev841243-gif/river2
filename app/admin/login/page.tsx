import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/auth'
import { LoginForm } from './login-form'

// Форма зависит от куки — кэшировать её нельзя.
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  // Уже вошёл — нечего показывать форму.
  if (await getAdmin()) redirect('/admin')

  const { next } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-serif text-2xl text-primary">Судоходная Компания «Дно»</div>
          <p className="mt-1 text-sm text-muted-foreground">Панель управления</p>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  )
}
