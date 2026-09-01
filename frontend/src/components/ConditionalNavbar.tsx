import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'

const HIDDEN_ON = ['/login', '/register']

export default function ConditionalNavbar() {
  const { pathname } = useLocation()

  if (HIDDEN_ON.includes(pathname)) {
    return null
  }

  return <Navbar />
}
