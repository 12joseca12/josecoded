import { describe, expect, it } from "vitest";

import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import { barSlots, isCurrentPath, staffNav } from "./nav";

interface Tree {
  [key: string]: string | Tree;
}

function resolve(tree: Tree, key: string): string | undefined {
  let node: string | Tree | undefined = tree;
  for (const part of key.split(".")) {
    node = typeof node === "object" ? node[part] : undefined;
  }
  return typeof node === "string" ? node : undefined;
}

describe("staff navigation registry", () => {
  const zones = Object.entries(staffNav).filter(([, entries]) => entries.length > 0);

  it("starts every zone with its overview at the root", () => {
    for (const [, entries] of zones) {
      expect(entries[0]?.key).toBe("overview");
      expect(entries[0]?.path).toBe("");
    }
  });

  it("has unique keys and paths inside a zone", () => {
    for (const [, entries] of zones) {
      expect(new Set(entries.map((entry) => entry.key)).size).toBe(entries.length);
      expect(new Set(entries.map((entry) => entry.path)).size).toBe(entries.length);
    }
  });

  it("only marks the shipped screens as ready", () => {
    const ready = (zone: "admin" | "crm" | "area") =>
      staffNav[zone].filter((entry) => entry.ready).map((entry) => entry.key);
    expect(ready("admin")).toEqual([
      "overview",
      "leads",
      "users",
      "prices",
      "system",
      "audit",
      "notifications",
      "receivables",
      "payouts",
    ]);
    expect(ready("crm")).toEqual([
      "overview",
      "contacts",
      "leads",
      "commissions",
      "start",
      "settings",
    ]);
    expect(ready("area")).toEqual(["overview", "tasks", "stories", "chat"]);
  });

  it("registers the freelance zone without screens", () => {
    expect(staffNav.freelance).toEqual([]);
  });

  it("has a label in every locale", () => {
    for (const [, entries] of zones) {
      for (const entry of entries) {
        expect(resolve(es as Tree, entry.label), entry.label).toBeTruthy();
        expect(resolve(en as Tree, entry.label), entry.label).toBeTruthy();
      }
    }
  });

  it("keeps the bottom bar to four slots counting the more button", () => {
    expect(barSlots).toBe(3);
  });
});

describe("isCurrentPath", () => {
  it("matches the root exactly and sections by prefix", () => {
    expect(isCurrentPath("/es/admin", "/es/admin", "/es/admin")).toBe(true);
    expect(isCurrentPath("/es/admin/interesados", "/es/admin", "/es/admin")).toBe(false);
    expect(isCurrentPath("/es/admin/interesados", "/es/admin/interesados", "/es/admin")).toBe(true);
    expect(isCurrentPath("/es/admin/interesados/x", "/es/admin/interesados", "/es/admin")).toBe(
      true,
    );
    expect(isCurrentPath("/es/admin/interesadosx", "/es/admin/interesados", "/es/admin")).toBe(
      false,
    );
  });
});
