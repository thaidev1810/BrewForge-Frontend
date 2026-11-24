import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { isDemoMode } from '@/constants/config'
import { roleConfig } from '@/constants/roles'
import { CoffeeCanvas } from '@/components/common/CoffeeCanvas'
import { login } from './authSlice'
import { DEV_SEED_PASSWORD, seededDevAccounts } from './authTypes'
import { DEMO_PASSWORD, demoUsers } from './mockAuthService'

const schema = z.object({
  username: z.string().trim().min(1, 'Enter your username or email.'),
  password: z.string().min(1, 'Enter your password.'),
})

type LoginForm = z.infer<typeof schema>

/** Scenes cycled on the showcase panel: [seed, palette, caption]. Seeds follow the shader: 0 latte, 1 beans, 2 espresso, 3 cream, 4 iced. */
const SHOWCASE: [number, string, string][] = [
  [10, 'crema', 'Rosetta · Released v2'],
  [2, 'caramel', 'Espresso · 18g in, 36g out'],
  [4, 'mocha', 'Cold brew · 14h steep'],
  [1, 'espresso', 'Single origin · Medium roast'],
]

const STATS: [string, string][] = [
  ['1', 'Released version per drink'],
  ['80%', 'Quiz pass mark'],
  ['8', 'Roles, one standard'],
]

export function LoginPage() {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [picked, setPicked] = useState('')
  const [scene, setScene] = useState(0)
  const [fading, setFading] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  // Every few seconds the showcase panel pours into the next coffee scene.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let swap: ReturnType<typeof setTimeout>
    const id = setInterval(() => {
      setFading(true)
      swap = setTimeout(() => {
        setScene((value) => (value + 1) % SHOWCASE.length)
        setFading(false)
      }, 500)
    }, 8000)
    return () => {
      clearInterval(id)
      clearTimeout(swap)
    }
  }, [])

  const accounts = useMemo(
    () =>
      isDemoMode
        ? demoUsers.map((user) => ({ value: user.email, short: user.username ?? user.role.toLowerCase(), label: `${roleConfig[user.role].label} (${user.username})`, password: DEMO_PASSWORD }))
        : seededDevAccounts.map((acc) => ({ value: acc.username, short: acc.username, label: acc.label, password: DEV_SEED_PASSWORD })),
    [],
  )
  const pickedAccount = accounts.find((acc) => acc.value === picked)
  const [seed, palette, caption] = SHOWCASE[scene]

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.12fr)_minmax(460px,.88fr)]">
      {/* Showcase */}
      <section className="grain relative hidden overflow-hidden bg-[#120b09] text-[#f6efe7] lg:block">
        <div className={`absolute inset-x-0 top-0 h-[78%] [mask-image:linear-gradient(to_bottom,#000_72%,transparent)] transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true">
          <CoffeeCanvas seed={seed} palette={palette} zoom={1.9} quality={0.75} />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,11,9,.6)_0%,rgba(18,11,9,0)_20%,rgba(18,11,9,0)_40%,rgba(18,11,9,.88)_68%,#120b09_86%)]" aria-hidden="true" />
        <div className="relative z-10 flex h-full min-h-screen flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/brewforge-icon.png"
                alt="BrewForge Logo"
                className="size-11 rounded-[14px] object-cover shadow-[0_10px_24px_-10px_rgba(200,75,49,.9)]"
              />
              <span className="font-display text-xl font-extrabold tracking-[-0.02em]">BrewForge</span>
            </div>
            <p className="eyebrow !text-white/70" aria-live="polite">{caption}</p>
          </div>

          <div>
            <h2 className="rise text-[clamp(48px,5.8vw,104px)] font-semibold leading-[.92] tracking-[-0.05em]">
              One recipe.
              <br />
              <span className="serif-i">Every cup.</span>
            </h2>
            <p className="rise mt-6 max-w-md text-[17px] leading-snug text-white/70" style={{ '--d': 2 } as React.CSSProperties}>
              Recipe standardization and barista training for a tea and coffee chain, from the R&amp;D bench to the counter.
            </p>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-white/15 pt-6">
              {STATS.map(([value, label], i) => (
                <div key={label} className="rise" style={{ '--d': 3 + i } as React.CSSProperties}>
                  <dt className="text-[34px] font-semibold leading-none tracking-[-0.04em]">{value}</dt>
                  <dd className="eyebrow plain mt-2 !text-[10px] !text-white/55">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="relative flex min-h-screen flex-col justify-center px-6 py-10 sm:px-12 xl:px-20">
        <Link to="/" className="eyebrow plain absolute left-6 top-8 inline-flex items-center gap-2 transition hover:text-brand sm:left-12 xl:left-20">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to home
        </Link>

        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3">
            <img
              src="/brewforge-logo.png"
              alt="BrewForge Official Logo"
              className="h-16 w-auto rounded-2xl border border-border/60 object-contain shadow-xs"
            />
            <div>
              <span className="font-display text-xl font-extrabold tracking-[-0.02em]">BrewForge</span>
              <span className="block text-xs text-muted-foreground">Recipe Standardization &amp; Barista Academy</span>
            </div>
          </div>

          <p className="eyebrow rise mb-5">Sign in</p>
          <h1 className="rise text-[clamp(40px,4.4vw,60px)] font-semibold leading-[.98] tracking-[-0.045em]" style={{ '--d': 1 } as React.CSSProperties}>
            Welcome <span className="serif-i text-brand">back.</span>
          </h1>
          <p className="rise mt-4 text-[16px] leading-snug text-muted-foreground" style={{ '--d': 2 } as React.CSSProperties}>
            Your workspace for consistent craft and confident teams.
          </p>

          <div className="rise mt-8" style={{ '--d': 3 } as React.CSSProperties}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p id="quick-fill" className="eyebrow plain">{isDemoMode ? 'Try a demo role' : 'Quick fill a seeded account'}</p>
              <p className="eyebrow plain !text-[10px]">
                {isDemoMode ? 'Demo' : 'Seed'} password · <span className="text-foreground">{isDemoMode ? DEMO_PASSWORD : DEV_SEED_PASSWORD}</span>
              </p>
            </div>
            <div role="group" aria-labelledby="quick-fill" className="flex flex-wrap gap-2">
              {accounts.map((acc) => (
                <button
                  key={acc.value}
                  type="button"
                  className="chip-acct"
                  aria-pressed={picked === acc.value}
                  title={acc.label}
                  onClick={() => {
                    setPicked(acc.value)
                    setValue('username', acc.value, { shouldValidate: true })
                    setValue('password', acc.password, { shouldValidate: true })
                  }}
                >
                  {acc.short}
                </button>
              ))}
            </div>
            <p className="mt-3 min-h-5 text-[13px] text-muted-foreground" aria-live="polite">
              {pickedAccount ? pickedAccount.label : 'Pick one to fill the form, or type your own below.'}
            </p>
          </div>

          <form
            className="rise mt-6 space-y-5"
            style={{ '--d': 4 } as React.CSSProperties}
            onSubmit={handleSubmit((values) => {
              void dispatch(login({ username: values.username, password: values.password }))
            })}
          >
            <div>
              <label htmlFor="username" className="eyebrow plain mb-2 block">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="e.g. admin, rdspec, trainer…"
                className="field-ctl"
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : undefined}
                {...register('username')}
              />
              {errors.username && (
                <p id="username-error" className="mt-1.5 text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="eyebrow plain mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="field-ctl pr-12"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <p role="alert" className="note note-error">
                {error}
              </p>
            )}
            <button className="btn-go" disabled={loading} type="submit">
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="arr size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="eyebrow plain rise mt-10 !text-[10px]" style={{ '--d': 5 } as React.CSSProperties}>
            BrewForge · Recipe standardization &amp; barista training
          </p>
        </div>
      </section>
    </main>
  )
}
