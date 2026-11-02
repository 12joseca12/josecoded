import { describe, expect, it } from "vitest";

import {
  activeBlockId,
  atBottom,
  homeSlug,
  navFlags,
  resolveActive,
  ringDashOffset,
  ringPath,
  stripLocale,
} from "./nav";

const slugs = ["proyectos", "servicios", "contacto"];

describe("resolveActive", () => {
  it("strips the locale", () => {
    expect(stripLocale("/es/proyectos/app")).toBe("proyectos/app");
    expect(stripLocale("/es")).toBe("");
  });

  it("matches the first route segment", () => {
    expect(resolveActive(slugs, "/es/proyectos/app", null)).toBe("proyectos");
    expect(resolveActive(slugs, "/es/legal/aviso", null)).toBeNull();
  });

  it("uses the visible section on the home", () => {
    expect(resolveActive(slugs, "/es", "servicios")).toBe("servicios");
    expect(resolveActive(slugs, "/es", "hero")).toBe(homeSlug);
    expect(resolveActive(slugs, "/es", null)).toBe(homeSlug);
  });

  it("ignores the section outside the home", () => {
    expect(resolveActive(slugs, "/es/contacto", "servicios")).toBe("contacto");
  });
});

describe("activeBlockId", () => {
  const blocks = [
    { id: "a", top: 0, bottom: 800 },
    { id: "b", top: 800, bottom: 1600 },
  ];

  it("picks the block under the probe line", () => {
    expect(activeBlockId(blocks, 400, false)).toBe("a");
    expect(activeBlockId(blocks, 800, false)).toBe("b");
  });

  it("returns null without a match or blocks", () => {
    expect(activeBlockId(blocks, 2000, false)).toBeNull();
    expect(activeBlockId([], 10, false)).toBeNull();
  });

  it("selects the last block at the bottom", () => {
    expect(activeBlockId(blocks, 100, true)).toBe("b");
  });
});

describe("page flags", () => {
  it("flags scrolled and condensed by thresholds", () => {
    expect(navFlags(0, 900)).toEqual({ scrolled: false, condensed: false });
    expect(navFlags(20, 900)).toEqual({ scrolled: true, condensed: false });
    expect(navFlags(300, 900)).toEqual({ scrolled: true, condensed: true });
  });

  it("detects the bottom only when the page scrolls", () => {
    expect(atBottom(0, 900, 900)).toBe(false);
    expect(atBottom(1100, 900, 2000)).toBe(true);
    expect(atBottom(500, 900, 2000)).toBe(false);
  });
});

describe("capsule ring", () => {
  it("starts top-center and closes the path", () => {
    const path = ringPath(400, 52);
    expect(path.startsWith("M200.00 1.00H")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path.match(/A/g)).toHaveLength(4);
  });

  it("uses a radius of half the height minus the inset", () => {
    expect(ringPath(400, 52)).toContain("A25.00 25.00 0 0 1 399.00 26.00");
  });

  it("returns an empty path without size", () => {
    expect(ringPath(0, 52)).toBe("");
  });

  it("maps progress to a clamped dash offset", () => {
    expect(ringDashOffset(0)).toBe(1);
    expect(ringDashOffset(0.25)).toBe(0.75);
    expect(ringDashOffset(1)).toBe(0);
    expect(ringDashOffset(3)).toBe(0);
    expect(ringDashOffset(-1)).toBe(1);
  });
});
