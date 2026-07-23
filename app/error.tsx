'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[tattoo-prehab] client render failed', error);
  }, [error]);

  return (
    <main className="app-error" role="alert">
      <p className="kicker">Application recovery</p>
      <h1>This screen could not load.</h1>
      <p>Your exercise content and saved progress have not been deleted.</p>
      <button type="button" onClick={reset}>Try again</button>
    </main>
  );
}
