import { SignUp } from '@clerk/nextjs';
import { AuthSetupRequired } from '@/components/account/AuthSetupRequired';
import { isClerkConfigured } from '@/lib/auth/config';

export const metadata = { title: 'Create account' };

export default function SignUpPage() {
  if (!isClerkConfigured()) return <AuthSetupRequired />;
  return <main className="auth-shell"><SignUp /></main>;
}
