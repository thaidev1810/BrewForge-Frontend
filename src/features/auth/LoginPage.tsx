import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Coffee } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { isDemoMode } from '@/constants/config'
import { roleConfig } from '@/constants/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from './authSlice'
import { DEMO_PASSWORD, demoUsers } from './mockAuthService'

const schema = z.object({ email: z.email('Enter a valid email address.'), password: z.string().min(1, 'Enter your password.') })
type LoginForm = z.infer<typeof schema>
export function LoginPage() {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })
  return <main className="grid min-h-screen place-items-center p-6"><section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
    <div className="mb-8 flex items-center gap-3"><Coffee className="size-9 text-caramel" aria-hidden="true" /><span className="text-2xl font-bold">BrewForge</span></div>
    <h1 className="text-2xl font-semibold">Welcome back</h1><p className="mt-2 text-muted-foreground">Your workspace for consistent craft and confident teams.</p>
    {isDemoMode && <div className="mt-6 rounded-lg bg-accent p-4 text-sm"><label htmlFor="demo-user" className="font-medium">Try a demo role</label><select id="demo-user" className="mt-2 h-10 w-full rounded-md border bg-background px-2" defaultValue="" onChange={(event) => { setValue('email', event.target.value, { shouldValidate: true }); setValue('password', DEMO_PASSWORD) }}><option value="" disabled>Select a demo user</option>{demoUsers.map((user) => <option key={user.id} value={user.email}>{roleConfig[user.role].label}</option>)}</select><p className="mt-2 text-muted-foreground">Demo password: {DEMO_PASSWORD}</p></div>}
    <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => { void dispatch(login(values)) })}>
      <div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label><Input id="email" type="email" autoComplete="username" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} />{errors.email && <p id="email-error" className="mt-1 text-sm text-destructive">{errors.email.message}</p>}</div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} {...register('password')} />{errors.password && <p id="password-error" className="mt-1 text-sm text-destructive">{errors.password.message}</p>}</div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={loading} type="submit">{loading ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  </section></main>
}
