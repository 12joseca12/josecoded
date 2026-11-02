/**
 * Holds the single-use Turnstile token of the first message. `wait` resolves with the token as soon as there is one, or
 * with `null` when the wait times out or the widget reports the token expired or failed, so the send never hangs.
 */
export function createTokenGate() {
  let value: string | undefined;
  let waiters: ((token: string | null) => void)[] = [];
  return {
    set(token: string | null) {
      value = token ?? undefined;
      const pending = waiters;
      waiters = [];
      pending.forEach((resolve) => resolve(token));
    },
    /** Forget the token (it is single use). */
    clear() {
      value = undefined;
    },
    wait(timeoutMs: number): Promise<string | null> {
      if (value) return Promise.resolve(value);
      return new Promise<string | null>((resolve) => {
        const timer = setTimeout(() => {
          waiters = waiters.filter((w) => w !== done);
          resolve(null);
        }, timeoutMs);
        const done = (token: string | null) => {
          clearTimeout(timer);
          resolve(token);
        };
        waiters.push(done);
      });
    },
  };
}
