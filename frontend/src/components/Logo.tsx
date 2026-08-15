import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link
      to="/"
      className="fixed left-6 top-6 z-10 text-lg font-semibold tracking-tight"
    >
      <span className="text-blue-600">ur</span>
      <span className="text-black">-career</span>
    </Link>
  )
}
