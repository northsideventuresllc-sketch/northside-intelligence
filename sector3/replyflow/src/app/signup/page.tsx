import { redirect } from 'next/navigation'
import { portalSignUpUrl } from '@/lib/ni-auth'

export default function SignupPage() {
  redirect(portalSignUpUrl())
}
