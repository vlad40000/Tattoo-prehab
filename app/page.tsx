import { auth } from '@clerk/nextjs/server';
import { TattooPrehabApp } from '@/components/app/TattooPrehabApp';
import { isClerkConfigured } from '@/lib/auth/config';

export default async function Page() {
  const accountsEnabled = isClerkConfigured();
  if (accountsEnabled) {
    const { isAuthenticated, redirectToSignIn } = await auth();
    if (!isAuthenticated) return redirectToSignIn({ returnBackUrl: '/' });
  }

  return <TattooPrehabApp accountsEnabled={accountsEnabled} />;
}
