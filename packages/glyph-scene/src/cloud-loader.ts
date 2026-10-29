import { cloudSetSteps, computeCloudSet, type CloudReply, type CloudSet } from './cloud-set';

type Idle = (cb: () => void) => void;

const defaultIdle: Idle = (cb) => {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => cb());
  else setTimeout(cb, 0);
};

/** Without Worker: one chunk of the generator per idle callback, so no single task blocks the main thread. */
export function loadChunked(n: number, seed: number, idle: Idle = defaultIdle): Promise<CloudSet> {
  return new Promise((resolve, reject) => {
    const it = cloudSetSteps(n, seed);
    const run = () => {
      try {
        const r = it.next();
        if (r.done) resolve(r.value);
        else idle(run);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    idle(run);
  });
}

function loadInWorker(n: number, seed: number): Promise<CloudSet> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    const done = () => worker.terminate();
    worker.onmessage = (e: MessageEvent<CloudReply>) => {
      done();
      if (e.data.type === 'clouds') resolve(e.data.set);
      else reject(new Error(e.data.message));
    };
    worker.onerror = (e) => {
      done();
      reject(new Error(e.message || 'worker failed'));
    };
    worker.postMessage({ type: 'clouds', id: 1, n, seed });
  });
}

/** Clouds in a Web Worker; on any worker failure (or no Worker at all) falls back to idle chunks on this thread. */
export async function loadClouds(n: number, seed: number): Promise<CloudSet> {
  if (typeof Worker === 'function') {
    try {
      return await loadInWorker(n, seed);
    } catch {
      // fall through to the main-thread path
    }
  }
  return loadChunked(n, seed);
}

export { computeCloudSet };
