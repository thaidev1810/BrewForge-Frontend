import { Provider } from 'react-redux'
import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { store } from './app/store'
import { router } from './app/router'
import { AuthBootstrap } from '@/features/auth/AuthBootstrap'

export default function App() {
  return <Provider store={store}><AuthBootstrap><Suspense fallback={<p role="status" className="p-8">Loading workspace…</p>}><RouterProvider router={router} /></Suspense></AuthBootstrap></Provider>
}
