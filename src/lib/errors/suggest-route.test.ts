import { describe, expect, it } from "vitest";

import { suggestRoute } from "./suggest-route";

const available = { projects: true };

describe("suggestRoute", () => {
  it("suggests the closest page when the path contains one of its words", () => {
    expect(suggestRoute("/es/servicio-web", available)).toBe("services");
    expect(suggestRoute("/es/servicios/freelances", available)).toBe("freelance");
    expect(suggestRoute("/es/a-la-medida", available)).toBe("offers");
    expect(suggestRoute("/es/proyecto/uno", available)).toBe("projects");
    expect(suggestRoute("/es/contactar", available)).toBe("contact");
    expect(suggestRoute("/es/curriculum", available)).toBe("about");
    expect(suggestRoute("/es/trabajo", available)).toBe("how");
    expect(suggestRoute("/es/privacidad-de-datos", available)).toBe("privacy");
    expect(suggestRoute("/es/cookies-policy", available)).toBe("cookies");
  });

  it("ignores case, accents and the locale prefix", () => {
    expect(suggestRoute("/es/Contáctame", available)).toBe("contact");
    expect(suggestRoute("/ES/SERVICIOS-X", available)).toBe("services");
  });

  it("tolerates a typo in a long word", () => {
    expect(suggestRoute("/es/servicos", available)).toBe("services");
    expect(suggestRoute("/es/proyects", available)).toBe("projects");
  });

  it("prefers the most specific page", () => {
    expect(suggestRoute("/es/servicios-freelance", available)).toBe("freelance");
  });

  it("falls back to the about page when projects are not published", () => {
    expect(suggestRoute("/es/proyectos/x", { projects: false })).toBe("about");
  });

  it("returns null when nothing looks similar or the page does not exist", () => {
    expect(suggestRoute("/es/no-existe", available)).toBeNull();
    expect(suggestRoute("/es/blog/articulo", available)).toBeNull();
    expect(suggestRoute("/", available)).toBeNull();
    expect(suggestRoute("/es", available)).toBeNull();
  });
});
