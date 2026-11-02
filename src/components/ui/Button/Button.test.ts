import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

const render = (props: Parameters<typeof Button>[0]) =>
  renderToStaticMarkup(createElement(Button, props));

describe("Button", () => {
  it("renders a button with type button by default", () => {
    const html = render({ children: "Go" });
    expect(html).toMatch(/^<button[^>]*type="button"/);
    expect(html).not.toContain("aria-busy");
  });

  it("disables itself and sets aria-busy while loading, keeping the label", () => {
    const html = render({ children: "Send", loading: true, loadingLabel: "Loading" });
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Send");
    expect(html).toContain("Loading");
  });

  it("renders an anchor when href is given", () => {
    const html = render({ children: "Open", href: "/es" });
    expect(html).toMatch(/^<a[^>]*href="\/es"/);
  });

  it("drops the href and marks the anchor disabled while loading", () => {
    const html = render({ children: "Open", href: "/es", loading: true });
    expect(html).not.toContain("href=");
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-busy="true"');
  });
});
