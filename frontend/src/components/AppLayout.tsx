import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import UserMenu from './UserMenu'

export default function AppLayout() {
  return (
    <div className="min-h-svh bg-slate-50">
      <Sidebar />
      <div className="relative ml-64">
        <UserMenu />
        <Outlet />
      </div>
    </div>
  )
}
