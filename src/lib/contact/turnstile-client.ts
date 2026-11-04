let pending: Promise<TurnstileApi> | null = null;

export function loadTurnstile(scriptUrl: string): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (pending) return pending;
  pending = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    const separator = scriptUrl.includes("?") ? "&" : "?";
    script.src = `${scriptUrl}${separator}render=explicit`;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("turnstile_missing"));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("turnstile_load_failed"));
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}
