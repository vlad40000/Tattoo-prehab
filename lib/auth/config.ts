export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  );
}

export type AuthenticationMode = 'clerk' | 'device';

export function authenticationMode(): AuthenticationMode {
  return isClerkConfigured() ? 'clerk' : 'device';
}
