export const minimumRequestCodeMs = 700;

export async function withMinimumDuration<T>(ms: number, run: () => Promise<T>): Promise<T> {
  const started = Date.now();
  try {
    return await run();
  } finally {
    const remaining = ms - (Date.now() - started);
    if (remaining > 0) await new Promise<void>((resolve) => setTimeout(resolve, remaining));
  }
}
