// Manual evals against a running gateway (`wrangler dev --remote`, API_MODE=development, Turnstile test secret):
//   pnpm --filter josecoded-api eval -- evals/proposals.jsonl http://127.0.0.1:8787
//   pnpm --filter josecoded-api eval -- evals/chat-cases.jsonl http://127.0.0.1:8787
// Prints one line per case with pass/fail; the output goes in the PR before merge (plan 3.7 and 4.4). Costs real
// model calls: it is never part of CI.
import { readFileSync } from 'node:fs';

const [file, base = 'http://127.0.0.1:8787'] = process.argv.slice(2).filter((a) => a !== '--');
if (!file) throw new Error('usage: eval.mjs <cases.jsonl> [baseUrl]');
const cases = readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const json = { 'content-type': 'application/json', origin: 'http://localhost:3000' };
const text = (value) => JSON.stringify(value);

let failures = 0;
for (const c of cases) {
  let out;
  if (c.answers) {
    const res = await fetch(`${base}/api/v1/proposals/generate`, { method: 'POST', headers: json, body: text({ locale: c.locale, turnstileToken: 'XXXX.DUMMY.TOKEN', answers: c.answers }) });
    const body = await res.json();
    out = { status: res.status, shown: text(body.data ?? body), pack: body.data?.pack?.code, priceFrom: body.data?.priceFrom };
  } else {
    const created = await fetch(`${base}/api/v1/assistant/threads`, { method: 'POST', headers: json, body: text({ case: c.case, locale: c.locale, originPath: '/', turnstileToken: 'XXXX.DUMMY.TOKEN' }) });
    const cookie = created.headers.get('set-cookie')?.split(';')[0] ?? '';
    const { data } = await created.json();
    const res = await fetch(`${base}/api/v1/assistant/threads/${data.threadId}/messages`, { method: 'POST', headers: { ...json, cookie }, body: text({ content: c.message }) });
    const body = await res.json();
    out = { status: res.status, shown: body.data?.assistant?.content ?? text(body) };
  }
  const problems = [];
  if (out.status !== 200 && out.status !== 201) problems.push(`status ${out.status}`);
  if (c.expect.pack && out.pack !== c.expect.pack) problems.push(`pack ${out.pack} != ${c.expect.pack}`);
  if (c.expect.noMatch && new RegExp(c.expect.noMatch, 'i').test(out.shown)) problems.push(`matches /${c.expect.noMatch}/`);
  if (c.expect.noUnlistedPrice && /\b\d{3,}\b/.test(out.shown.replace(/\b(900|1400|2500|4200|4000|6000|250|600|300|149)\b/g, ''))) problems.push('unlisted figure');
  if (c.expect.onlyListedLinks && /https?:\/\//i.test(out.shown)) problems.push('link in answer (check it is listed in facts.links)');
  if (problems.length) failures += 1;
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${c.id}${problems.length ? ` — ${problems.join('; ')}` : ''}`);
}
console.log(`${cases.length - failures}/${cases.length} passed`);
process.exit(failures ? 1 : 0);
