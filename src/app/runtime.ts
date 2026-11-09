import { createAuthClient } from '../auth/authClient';
import { createSessionStore } from '../auth/session';
import { createConfirmationFlow } from '../auth/confirmFlow';
import { createAccountApi } from '../api/client';
import type { Fetcher } from '../api/http';
import type { PublicConfig } from '../config/publicConfig';
export function createPortalRuntime(config: PublicConfig, fetcher: Fetcher = fetch) {
  const auth = createAuthClient(config, fetcher);
  const session = createSessionStore(auth);
  return {
    signupOpen: config.signupMode === 'open',
    session,
    api: createAccountApi(session, config, fetcher),
    confirmation: createConfirmationFlow(session),
    recover: (email: string) => auth.recover(email, new AbortController().signal),
  };
}
export type PortalRuntime = ReturnType<typeof createPortalRuntime>;
