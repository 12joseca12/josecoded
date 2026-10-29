import { afterEach, expect, it, vi } from 'vitest';

import { loadChunked, loadClouds } from '../src/cloud-loader';
import { cloudSetSteps, computeCloudSet, handleCloudRequest, type CloudReply, type CloudRequest } from '../src/cloud-set';
import { CHARS } from '../src/glyphs';

afterEach(() => vi.unstubAllGlobals());

it('produces n particles per attribute, deterministic per seed', () => {
  const a = computeCloudSet(300, 1);
  const b = computeCloudSet(300, 1);
  expect(a.t0).toHaveLength(900);
  expect(a.t2).toHaveLength(900);
  expect(a.kind).toHaveLength(300);
  expect(Array.from(a.t1)).toEqual(Array.from(b.t1));
  expect(Array.from(a.aSeed)).toEqual(Array.from(b.aSeed));
  expect(Array.from(computeCloudSet(300, 2).t0)).not.toEqual(Array.from(a.t0));
  expect(Math.max(...a.aGlyph)).toBeLessThan(CHARS.length);
});

it('chunked loading yields between steps and equals the one-shot result', async () => {
  const steps = [...(function* () { const it = cloudSetSteps(100, 1); for (let r = it.next(); !r.done; r = it.next()) yield r; })()];
  expect(steps.length).toBe(3);
  let calls = 0;
  const set = await loadChunked(100, 1, (cb) => { calls++; queueMicrotask(cb); });
  expect(calls).toBe(4);
  expect(Array.from(set.t2)).toEqual(Array.from(computeCloudSet(100, 1).t2));
});

it('worker protocol: replies with the set and its transferables, or an error', () => {
  const req: CloudRequest = { type: 'clouds', id: 7, n: 50, seed: 1 };
  const { reply, transfer } = handleCloudRequest(req);
  expect(reply.type).toBe('clouds');
  expect(reply.id).toBe(7);
  expect(transfer).toHaveLength(8);
  const bad = handleCloudRequest({ ...req, n: -1 });
  expect(bad.reply.type).toBe('error');
  expect(bad.transfer).toEqual([]);
});

it('loadClouds uses a Worker when present and falls back when it fails', async () => {
  class OkWorker {
    onmessage: ((e: { data: CloudReply }) => void) | null = null;
    onerror: ((e: { message: string }) => void) | null = null;
    postMessage(msg: CloudRequest) {
      const { reply } = handleCloudRequest(msg);
      queueMicrotask(() => this.onmessage?.({ data: reply }));
    }
    terminate() {}
  }
  vi.stubGlobal('Worker', OkWorker);
  const viaWorker = await loadClouds(80, 1);
  expect(viaWorker.n).toBe(80);

  class FailingWorker extends OkWorker {
    override postMessage() {
      queueMicrotask(() => this.onerror?.({ message: 'boom' }));
    }
  }
  vi.stubGlobal('Worker', FailingWorker);
  const fallback = await loadClouds(80, 1);
  expect(Array.from(fallback.t0)).toEqual(Array.from(viaWorker.t0));
});
