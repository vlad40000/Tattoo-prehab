import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function AuthSetupRequired() {
  return (
    <main className="auth-shell">
      <section className="auth-setup-card">
        <span><ShieldCheck size={28} aria-hidden /></span>
        <p className="kicker">Account setup</p>
        <h1>Secure login is not connected yet.</h1>
        <p>The training app remains available with private on-device records until the production authentication keys are provisioned.</p>
        <Link className="primary-action" href="/">Return to Tattoo Prehab</Link>
      </section>
    </main>
  );
}
