import 'server-only';

import { envServerSchema } from '@josecoded/types';

import { parse } from './env';

import type { EnvServer } from '@josecoded/types';

/**
 * Server secrets, read on first call (not at import) so a build or a test that never needs them does
 * not fail. `server-only` makes importing this module from a client component a build error, so the
 * secret variable names do not ship to the browser.
 */
export const serverEnv = (): EnvServer =>
  parse(
    envServerSchema,
    {
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      SERVER_KEY: process.env.SERVER_KEY,
      CALCOM_WEBHOOK_SECRET: process.env.CALCOM_WEBHOOK_SECRET,
    },
    'server',
  );
