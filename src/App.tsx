import { Provider } from 'react-redux'
import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { store } from './app/store'
import { router } from './app/router'

export default function App() {
  return <Provider store={store}><Suspense fallback={<p role="status" className="p-8">Loading workspace…</p>}><RouterProvider router={router} /></Suspense></Provider>
}
