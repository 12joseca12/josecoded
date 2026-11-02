// In-memory stand-in for the Supabase HTTP API the gateway calls (`/auth/v1/user`, PostgREST `staff_members` and
// the service-role RPCs of migration 20261028100000_base.sql), plus Telegram's sendMessage. It is a `fetch`: the
// tests stub the global with it, so the real adapters (supabase-js included) run unchanged. The outbox RPCs
// mirror the SQL: claim counts the attempt and skips claimed rows younger than 10 minutes, ack/fail only touch the
// worker's rows, and fail at the 10th attempt dead-letters once and enqueues system.outbox_dead.

export type OutboxRow = {
  id: number;
  event: string;
  payload: Record<string, unknown>;
  created_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  attempts: number;
  delivered_at: string | null;
  dead_at: string | null;
  last_error: string | null;
};

export type JobRow = { name: string; cron: string; tz: string | null; next_run_at: string; enabled: boolean };

export type FakeUser = { id: string; email: string; jwt: string };

const TEN_MINUTES = 10 * 60_000;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export interface FakeSupabase {
  fetch: typeof fetch;
  outbox: OutboxRow[];
  jobs: JobRow[];
  staff: Set<string>;
  /** Active closers (`staff_members.role = 'closer'`). */
  closers: Set<string>;
  /** Staff rows with `disabled_at` set: never returned by a query that filters `disabled_at is null`. */
  disabledStaff: Set<string>;
  users: FakeUser[];
  quota: Map<string, { count: number; expiresAt: number }>;
  /** Texts posted to Telegram, in order. */
  telegram: { chatId: unknown; text: string }[];
  /** Status Telegram answers with (200 by default). */
  telegramStatus: number;
  /** RPC names called, in order. */
  rpcCalls: string[];
  /** Every request the fake received (method and path), in order. */
  requests: string[];
  enqueue(event: string, payload: Record<string, unknown>): OutboxRow;
  now(): number;
  /** Moves the fake database clock (`now()` of the SQL), e.g. past a 10-minute claim. */
  advance(ms: number): void;
}

/** A JWT-shaped token whose payload carries `aal`; the fake Auth accepts it if it belongs to a user. */
export function fakeJwt(sub: string, aal: 'aal1' | 'aal2'): string {
  const enc = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub, aal, role: 'authenticated' })}.signature`;
}

export function createFakeSupabase(options: { url?: string; secret?: string; start?: string } = {}): FakeSupabase {
  const base = (options.url ?? 'http://127.0.0.1:54321').replace(/\/$/, '');
  let clock = Date.parse(options.start ?? '2026-10-28T10:00:00.000Z');
  let nextId = 1;
  const iso = () => new Date(clock).toISOString();

  const state: FakeSupabase = {
    fetch: undefined as unknown as typeof fetch,
    outbox: [],
    jobs: [],
    staff: new Set(),
    closers: new Set(),
    disabledStaff: new Set(),
    users: [],
    quota: new Map(),
    telegram: [],
    telegramStatus: 200,
    rpcCalls: [],
    requests: [],
    now: () => clock,
    advance: (ms) => {
      clock += ms;
    },
    enqueue(event, payload) {
      const row: OutboxRow = {
        id: nextId++,
        event,
        payload,
        created_at: iso(),
        claimed_at: null,
        claimed_by: null,
        attempts: 0,
        delivered_at: null,
        dead_at: null,
        last_error: null,
      };
      state.outbox.push(row);
      return row;
    },
  };

  const live = (r: OutboxRow) => r.delivered_at === null && r.dead_at === null;
  const abandoned = (r: OutboxRow) => r.claimed_at !== null && Date.parse(r.claimed_at) < clock - TEN_MINUTES;

  function markDead(row: OutboxRow) {
    if (!live(row)) return;
    row.dead_at = iso();
    row.claimed_at = null;
    row.claimed_by = null;
    if (row.event !== 'system.outbox_dead') {
      state.enqueue('system.outbox_dead', {
        id: row.id,
        event: row.event,
        last_error: (row.last_error ?? 'abandoned claim').slice(0, 500),
      });
    }
  }

  const rpcs: Record<string, (args: Record<string, unknown>) => unknown> = {
    outbox_claim({ p_limit, p_worker }) {
      for (const r of state.outbox.filter((o) => live(o) && o.attempts >= 10 && abandoned(o))) markDead(r);
      const limit = Math.min(Math.max(Number(p_limit ?? 50), 1), 200);
      const picked = state.outbox
        .filter((o) => live(o) && o.attempts < 10 && (o.claimed_at === null || abandoned(o)))
        .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)
        .slice(0, limit);
      for (const r of picked) {
        r.claimed_at = iso();
        r.claimed_by = String(p_worker);
        r.attempts += 1;
      }
      return picked.map(({ id, event, payload, attempts, created_at }) => ({ id, event, payload, attempts, created_at }));
    },
    outbox_ack({ p_ids, p_worker }) {
      const ids = new Set((p_ids as number[]) ?? []);
      let n = 0;
      for (const r of state.outbox) {
        if (ids.has(r.id) && r.claimed_by === p_worker && live(r)) {
          r.delivered_at = iso();
          n += 1;
        }
      }
      return n;
    },
    outbox_fail({ p_id, p_worker, p_error }) {
      const r = state.outbox.find((o) => o.id === p_id && o.claimed_by === p_worker && live(o));
      if (!r) return false;
      r.last_error = String(p_error).slice(0, 2000);
      r.claimed_at = null;
      r.claimed_by = null;
      if (r.attempts >= 10) markDead(r);
      return true;
    },
    increment_quota({ p_key, p_limit, p_ttl }) {
      const seconds = /^(\d+) seconds?$/.exec(String(p_ttl));
      const ttl = seconds ? Number(seconds[1]) * 1000 : String(p_ttl) === '7 days' ? 7 * 86_400_000 : 60_000;
      const key = String(p_key);
      const q = state.quota.get(key);
      if (!q || q.expiresAt <= clock) state.quota.set(key, { count: 1, expiresAt: clock + ttl });
      else q.count += 1;
      return (state.quota.get(key)?.count ?? 0) <= Number(p_limit);
    },
    scheduled_jobs_due({ p_now }) {
      return state.jobs
        .filter((j) => j.enabled && Date.parse(j.next_run_at) <= Date.parse(String(p_now)))
        .sort((a, b) => a.next_run_at.localeCompare(b.next_run_at) || a.name.localeCompare(b.name))
        .map(({ name, cron, tz, next_run_at }) => ({ name, cron, tz, next_run_at }));
    },
    scheduled_jobs_mark_ran({ p_name, p_next_run_at }) {
      const j = state.jobs.find((x) => x.name === p_name);
      if (j) j.next_run_at = String(p_next_run_at);
      return null;
    },
    scheduled_jobs_disable({ p_name }) {
      const j = state.jobs.find((x) => x.name === p_name);
      if (j) j.enabled = false;
      return null;
    },
  };

  state.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    state.requests.push(`${req.method} ${url.origin}${url.pathname}`);

    if (url.hostname === 'api.telegram.org') {
      const body = (await req.json()) as { chat_id: unknown; text: string };
      if (state.telegramStatus !== 200) return json(state.telegramStatus, { ok: false, description: 'Bad Gateway' });
      state.telegram.push({ chatId: body.chat_id, text: body.text });
      return json(200, { ok: true, result: { message_id: state.telegram.length } });
    }

    if (`${url.origin}` !== base) return json(599, { message: `unexpected host ${url.origin}` });

    if (url.pathname === '/auth/v1/user') {
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
      const user = state.users.find((u) => u.jwt === token);
      return user ? json(200, { id: user.id, email: user.email }) : json(401, { msg: 'invalid JWT' });
    }

    const secretOk = options.secret ? req.headers.get('apikey') === options.secret : true;

    if (url.pathname === '/rest/v1/staff_members') {
      if (!secretOk) return json(401, { message: 'Invalid API key' });
      const userId = url.searchParams.get('user_id')?.replace(/^eq\./, '');
      const role = url.searchParams.get('role')?.replace(/^eq\./, '');
      const activeOnly = url.searchParams.get('disabled_at') === 'is.null';
      const isDisabled = userId !== undefined && state.disabledStaff.has(userId);
      const myRole = userId === undefined ? undefined : state.staff.has(userId) ? 'admin' : state.closers.has(userId) ? 'closer' : undefined;
      const rows =
        userId && myRole && (role === undefined || role === myRole) && !(activeOnly && isDisabled)
          ? [{ user_id: userId, role: myRole }]
          : [];
      return json(200, rows);
    }

    const rpc = /^\/rest\/v1\/rpc\/(\w+)$/.exec(url.pathname)?.[1];
    if (rpc && req.method === 'POST') {
      if (!secretOk) return json(401, { message: 'Invalid API key' });
      const handler = rpcs[rpc];
      if (!handler) return json(404, { code: 'PGRST202', message: `Could not find the function public.${rpc}` });
      state.rpcCalls.push(rpc);
      const args = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      return json(200, handler(args));
    }

    return json(404, { message: `unexpected ${req.method} ${url.pathname}` });
  }) as typeof fetch;

  return state;
}
