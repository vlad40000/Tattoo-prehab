import { UserProfile } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { AuthSetupRequired } from '@/components/account/AuthSetupRequired';
import { isClerkConfigured } from '@/lib/auth/config';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  if (!isClerkConfigured()) return <AuthSetupRequired />;
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn({ returnBackUrl: '/account' });
  return <main className="auth-shell"><UserProfile routing="path" path="/account" /></main>;
}
