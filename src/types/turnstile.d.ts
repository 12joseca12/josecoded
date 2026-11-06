interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  language?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "flexible" | "compact";
  execution?: "render" | "execute";
  appearance?: "always" | "execute" | "interaction-only";
  callback: (token: string) => void;
  "before-interactive-callback"?: () => void;
  "after-interactive-callback"?: () => void;
  "error-callback": () => void;
  "expired-callback": () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

interface Window {
  turnstile?: TurnstileApi;
}
