import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="min-h-svh bg-white pt-24">
      <Navbar />
      <Outlet />
    </div>
  )
}
