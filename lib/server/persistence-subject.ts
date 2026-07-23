import 'server-only';

import type { RequestIdentity } from '@/lib/server/identity';
import {
  getOrCreateAuthenticatedParticipantId,
  getOrCreateParticipantId,
} from '@/lib/server/participant';

export async function participantIdForIdentity(identity: RequestIdentity): Promise<string> {
  if (identity.kind === 'account') {
    return getOrCreateAuthenticatedParticipantId(identity.userId);
  }
  return getOrCreateParticipantId();
}
