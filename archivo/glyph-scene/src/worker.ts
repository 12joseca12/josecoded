import { handleCloudRequest, type CloudRequest } from './cloud-set';

/** Web Worker entry: computes the three clouds and transfers them to the main thread. */
type WorkerScope = {
  onmessage: ((e: MessageEvent<CloudRequest>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
};
const scope = globalThis as unknown as WorkerScope;

scope.onmessage = (e) => {
  if (e.data?.type !== 'clouds') return;
  const { reply, transfer } = handleCloudRequest(e.data);
  scope.postMessage(reply, transfer);
};
