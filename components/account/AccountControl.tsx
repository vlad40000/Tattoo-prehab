'use client';

import { UserButton } from '@clerk/nextjs';

export function AccountControl() {
  return (
    <div className="account-control" aria-label="Account menu">
      <UserButton
        userProfileMode="navigation"
        userProfileUrl="/account"
        appearance={{
          elements: {
            avatarBox: 'account-control__avatar',
          },
        }}
      />
    </div>
  );
}
