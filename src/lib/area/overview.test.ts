import { describe, expect, it } from "vitest";

import { buildRecentUpdates, linkDomain } from "./overview";
import { mapTodoError } from "./todo-actions";

describe("buildRecentUpdates", () => {
  const tasks = [{ id: "t1", title: "Task", done_at: "2026-11-03T10:00:00Z" }];
  const stories = [
    { id: "s1", title: "Story", status: "accepted" as const, decided_at: "2026-11-04T10:00:00Z" },
  ];
  const documents = [{ id: "d1", name: "Doc", created_at: "2026-11-02T10:00:00Z" }];

  const posts = [
    {
      id: "u1",
      body: "Catalog done",
      created_at: "2026-11-05T10:00:00Z",
      author_label: "team" as const,
    },
  ];

  it("mixes the sources newest first", () => {
    const updates = buildRecentUpdates(tasks, stories, documents, posts);
    expect(updates.map((update) => update.key)).toEqual([
      "update-u1",
      "story-s1",
      "task-t1",
      "document-d1",
    ]);
    expect(updates[0]).toMatchObject({ kind: "update", title: "Catalog done", author: "team" });
    expect(updates[1]?.status).toBe("accepted");
    expect(updates[2]?.status).toBeNull();
    expect(updates[2]?.author).toBeNull();
  });

  it("caps the list", () => {
    expect(buildRecentUpdates(tasks, stories, documents, posts, 2)).toHaveLength(2);
  });

  it("returns nothing without sources", () => {
    expect(buildRecentUpdates([], [], [], [])).toEqual([]);
  });
});

describe("linkDomain", () => {
  it("shows the host without www", () => {
    expect(linkDomain("https://www.figma.com/file/abc")).toBe("figma.com");
    expect(linkDomain("https://staging.example.com/x")).toBe("staging.example.com");
  });

  it("falls back to the raw value for a broken url", () => {
    expect(linkDomain("not a url")).toBe("not a url");
  });
});

describe("mapTodoError", () => {
  it("maps privilege errors to forbidden", () => {
    expect(mapTodoError({ code: "42501", message: "forbidden" })).toEqual({ status: "forbidden" });
  });

  it("maps already-changed rows to stale", () => {
    expect(mapTodoError({ code: "P0001", message: "story_not_in_review" })).toEqual({
      status: "stale",
    });
    expect(mapTodoError({ code: "P0001", message: "task_not_found" })).toEqual({ status: "stale" });
  });

  it("maps anything else to error", () => {
    expect(mapTodoError({ code: "XX000", message: "boom" })).toEqual({ status: "error" });
  });
});
