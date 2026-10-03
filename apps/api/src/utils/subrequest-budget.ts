/**
 * Subrequest budget of one scheduled invocation (DT §0b): at most 40 `fetch` + `env.AI.run` calls per tick
 * (Workers Free allows 50; the rest is margin). The wrapped functions throw `budget_exhausted` instead of
 * calling out once the budget is spent, so what does not fit waits for the next tick.
 */
export const DEFAULT_SUBREQUEST_LIMIT = 40;

export class BudgetExhaustedError extends Error {
  readonly code = 'budget_exhausted';

  constructor(limit: number) {
    super(`budget_exhausted: ${limit} subrequests used`);
    this.name = 'BudgetExhaustedError';
  }
}

type AiLike = { run(...args: never[]): unknown };

export interface SubrequestBudget {
  readonly limit: number;
  readonly used: number;
  readonly remaining: number;
  /** Counts one subrequest or throws BudgetExhaustedError. */
  take(): void;
  fetch: typeof fetch;
  /** `env.AI` with `run` counted; other members pass through. */
  ai<T extends AiLike>(binding: T): T;
}

export function createSubrequestBudget(
  fetchImpl: typeof fetch,
  limit: number = DEFAULT_SUBREQUEST_LIMIT,
): SubrequestBudget {
  let used = 0;

  const take = () => {
    if (used >= limit) throw new BudgetExhaustedError(limit);
    used += 1;
  };

  return {
    limit,
    get used() {
      return used;
    },
    get remaining() {
      return limit - used;
    },
    take,
    fetch: ((...args: Parameters<typeof fetch>) => {
      take();
      return fetchImpl(...args);
    }) as typeof fetch,
    ai: (binding) =>
      new Proxy(binding, {
        get(target, prop, receiver) {
          if (prop === 'run') {
            return (...args: never[]) => {
              take();
              return target.run(...args);
            };
          }
          return Reflect.get(target, prop, receiver) as unknown;
        },
      }),
  };
}
