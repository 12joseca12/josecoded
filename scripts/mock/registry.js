const routes = [];

export const pass = Symbol("pass");

export function route(method, pattern, handler) {
  routes.push({ method, pattern, handler });
}

export function readBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

export function send(response, status, body, type = "application/json") {
  response.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  response.end(typeof body === "string" ? body : JSON.stringify(body));
}

export function sendEmpty(response) {
  response.writeHead(204);
  response.end();
}

export async function dispatch(request, response, port) {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  for (const entry of routes) {
    if (entry.method !== request.method) continue;
    const match =
      typeof entry.pattern === "string"
        ? entry.pattern === url.pathname
          ? []
          : null
        : entry.pattern.exec(url.pathname);
    if (!match) continue;
    const result = await entry.handler({ request, response, url, match });
    if (result === pass) continue;
    return result;
  }
  return send(response, 404, { message: "not found" });
}
