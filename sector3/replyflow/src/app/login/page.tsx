import { redirect } from 'next/navigation'
import { portalSignInUrl } from '@/lib/ni-auth'

export default function LoginPage() {
  redirect(portalSignInUrl())
}
