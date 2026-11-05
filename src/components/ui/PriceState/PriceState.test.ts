import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PriceState } from "./PriceState";

const html = (props: Parameters<typeof PriceState>[0]) =>
  renderToStaticMarkup(createElement(PriceState, props));

describe("PriceState", () => {
  it("renders the review state as real text with no figure", () => {
    const markup = html({ variant: "review", label: "Precio en revisión", note: "En 24–48 h." });
    expect(markup).toContain('data-variant="review"');
    expect(markup).toContain("Precio en revisión");
    expect(markup).toContain("En 24–48 h.");
    expect(markup).not.toMatch(/\d{2,3}\s?€/);
  });

  it("renders a final figure with prefix, unit and caption", () => {
    const markup = html({
      variant: "final",
      prefix: "desde",
      amount: "1.200",
      unit: "€",
      caption: "Actualizado el 5 de noviembre",
    });
    expect(markup).toContain('data-variant="final"');
    expect(markup).toContain("desde");
    expect(markup).toContain("1.200");
    expect(markup).toContain("Actualizado el 5 de noviembre");
  });

  it("renders a range as its own variant", () => {
    const markup = html({ variant: "range", prefix: "entre", amount: "1.200–2.000", unit: "€" });
    expect(markup).toContain('data-variant="range"');
    expect(markup).toContain("1.200–2.000");
  });

  it("carries the size as a data attribute", () => {
    expect(html({ variant: "review", label: "x", size: "lg" })).toContain('data-size="lg"');
    expect(html({ variant: "review", label: "x" })).toContain('data-size="md"');
  });
});
