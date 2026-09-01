import { Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children?: ReactNode }) {
  return <div className="min-h-svh bg-white pt-24">{children ?? <Outlet />}</div>
}
