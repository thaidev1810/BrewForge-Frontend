import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Coffee, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from './authSlice'
const schema = z.object({ username: z.string().trim().min(1, 'Nhập tên đăng nhập.'), password: z.string().min(1, 'Nhập mật khẩu.') })
export function LoginPage() {
  const dispatch = useAppDispatch(), { loading, error } = useAppSelector(state => state.auth)
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  return <main className="login-shell"><section className="login-story"><div className="brand"><Coffee size={32} /> BrewForge</div><p className="eyebrow">CRAFT · CONSISTENCY · CONFIDENCE</p><h1>Mỗi ly nước.<br />Một tiêu chuẩn.</h1><p>Không gian làm việc chung cho công thức chuẩn, đào tạo đội ngũ và chất lượng tại từng chi nhánh.</p><div className="story-foot"><ShieldCheck /><span>Quy trình rõ ràng. Đội ngũ tự tin.</span></div></section><section className="login-form-panel"><div className="login-form"><Link to="/" className="text-link">← Về trang giới thiệu</Link><p className="eyebrow mt-6">CHÀO MỪNG TRỞ LẠI</p><h2>Đăng nhập workspace</h2><p className="muted">Sử dụng tài khoản được quản trị viên cung cấp.</p><form onSubmit={handleSubmit(values => { void dispatch(login(values)) })} className="space-y-5 mt-8"><div><label htmlFor="username">Tên đăng nhập</label><Input id="username" autoComplete="username" aria-invalid={!!errors.username} aria-describedby={errors.username ? 'username-error' : undefined} {...register('username')} />{errors.username && <p id="username-error" className="field-error">{errors.username.message}</p>}</div><div><label htmlFor="password">Mật khẩu</label><Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} {...register('password')} />{errors.password && <p id="password-error" className="field-error">{errors.password.message}</p>}</div>{error && <p role="alert" className="error-box">{error}</p>}<Button type="submit" className="w-full" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}<ArrowRight size={16} /></Button></form><p className="mt-6 text-xs muted">Nếu chưa có tài khoản hoặc cần đổi mật khẩu, liên hệ quản trị viên.</p></div></section></main>
}
