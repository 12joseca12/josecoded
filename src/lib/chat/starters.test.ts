import { describe, expect, it } from "vitest";

import { starterTopicFor } from "./starters";

describe("starterTopicFor", () => {
  it("maps pages to topics regardless of locale", () => {
    expect(starterTopicFor("/es")).toBe("default");
    expect(starterTopicFor("/es/servicios")).toBe("services");
    expect(starterTopicFor("/en/servicios/a-medida")).toBe("services");
    expect(starterTopicFor("/es/servicios/freelance")).toBe("freelance");
    expect(starterTopicFor("/es/sobre-mi")).toBe("about");
    expect(starterTopicFor("/es/contacto")).toBe("contact");
    expect(starterTopicFor("/es/blog")).toBe("default");
  });
});
