import { useEffect, type ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { bootstrapAuth } from '@/app/store'
import { logout } from './authSlice'
import { Button } from '@/components/ui/button'

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const { status, bootstrapError } = useAppSelector(s => s.auth), dispatch = useAppDispatch()
  useEffect(() => { void bootstrapAuth() }, [])
  if (status === 'initializing') return <main className="p-8" aria-live="polite">{bootstrapError ? <><p role="alert" className="error-box">Không khôi phục được phiên: {bootstrapError}</p><Button onClick={() => void bootstrapAuth()}>Thử lại khôi phục phiên</Button><Button variant="outline" onClick={() => dispatch(logout())}>Xóa phiên và đăng nhập lại</Button></> : <p role="status">Đang khôi phục phiên đăng nhập…</p>}</main>
  return children
}
