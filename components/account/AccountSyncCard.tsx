'use client';

import { Cloud, CloudAlert, Download, Upload } from 'lucide-react';
import type { ClientAccountState } from '@/lib/account-scope';

export function AccountSyncCard({
  state,
  legacyRecords,
  importing,
  message,
  onImport,
}: {
  state: ClientAccountState;
  legacyRecords: { sessions: number; checkins: number };
  importing: boolean;
  message: string | null;
  onImport: () => void;
}) {
  if (state.auth !== 'signed-in') return null;

  const legacyTotal = legacyRecords.sessions + legacyRecords.checkins;
  if (!state.syncReady) {
    return (
      <aside className="account-sync-card account-sync-card--warning">
        <span className="account-sync-card__icon"><CloudAlert size={20} aria-hidden /></span>
        <div>
          <strong>Account active · device storage only</strong>
          <p>Your login is ready, but cloud database sync still needs to be connected. New records remain safe on this device.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="account-sync-card">
      <span className="account-sync-card__icon"><Cloud size={20} aria-hidden /></span>
      <div className="account-sync-card__copy">
        <strong>{legacyTotal ? 'Bring this device’s existing history into your account' : 'Account sync is active'}</strong>
        <p>
          {legacyTotal
            ? `${legacyRecords.sessions} session${legacyRecords.sessions === 1 ? '' : 's'} and ${legacyRecords.checkins} check-in${legacyRecords.checkins === 1 ? '' : 's'} are still stored only on this device.`
            : 'Sessions and check-ins are attached to your account and available across signed-in devices.'}
        </p>
        {message && <small role="status">{message}</small>}
      </div>
      <div className="account-sync-card__actions">
        {legacyTotal > 0 && (
          <button type="button" className="secondary-action" onClick={onImport} disabled={importing}>
            <Upload size={16} aria-hidden /> {importing ? 'Importing…' : 'Import device history'}
          </button>
        )}
        <a className="secondary-action" href="/api/account/export" download>
          <Download size={16} aria-hidden /> Export history
        </a>
      </div>
    </aside>
  );
}
