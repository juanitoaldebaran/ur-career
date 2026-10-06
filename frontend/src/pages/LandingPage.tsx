import AppLayout from '../components/AppLayout'
import { HomeContent } from './HomePage'

export default function LandingPage() {
  return (
    <AppLayout>
      <HomeContent guest />
    </AppLayout>
  )
}
