import { SignIn } from '@clerk/nextjs';
import { AuthSetupRequired } from '@/components/account/AuthSetupRequired';
import { isClerkConfigured } from '@/lib/auth/config';

export const metadata = { title: 'Sign in' };

export default function SignInPage() {
  if (!isClerkConfigured()) return <AuthSetupRequired />;
  return <main className="auth-shell"><SignIn /></main>;
}
