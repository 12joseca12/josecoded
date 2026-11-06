import { randomUUID } from "node:crypto";

import { extendAuthState, stateFor } from "./auth.js";
import { callerOf, fail, operand } from "./crm.js";
import { readBody, route, send } from "./registry.js";

const emailShape = /^[^=+@\s-][^\s@]*@[^\s@]+\.[^\s@]+$/;
const phoneShape = /^[+0-9(][0-9 ().-]*$/;
const kinds = ["prospect", "client", "recruiter", "partner", "other"];

extendAuthState((state) => {
  state.imports = [];
  state.importMode = "data";
});

route("POST", "/__auth/import-mode", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").importMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

route("GET", "/rest/v1/imports", ({ request, response, url }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth, person, session } = caller;
  if (auth.importMode === "error") return fail(response, 500, "XX000", "internal");
  if (!person || session.level !== "aal2") return send(response, 200, []);
  let rows = auth.imports.filter(
    (entry) => person.role === "admin" || entry.owner_id === person.id,
  );
  const owner = url.searchParams.get("owner_id");
  if (owner) rows = rows.filter((entry) => entry.owner_id === operand(owner)[1]);
  const hash = url.searchParams.get("file_hash");
  if (hash) rows = rows.filter((entry) => entry.file_hash === operand(hash)[1]);
  rows = [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return send(response, 200, rows);
});

function neutral(value) {
  const text = String(value ?? "").trim();
  if (text === "") return null;
  return ["=", "+", "-", "@"].includes(text[0]) ? `'${text}` : text;
}

route("POST", "/rest/v1/rpc/import_contacts", async ({ request, response }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth, person, session } = caller;
  const body = JSON.parse(await readBody(request));
  auth.calls.crm.push({ kind: "import-contacts", body });
  if (!person || session.level !== "aal2" || !["admin", "closer"].includes(person.role)) {
    return fail(response, 403, "42501", "forbidden");
  }
  if (auth.importMode === "error") return fail(response, 500, "XX000", "internal");
  const rows = body.p_rows;
  if (!Array.isArray(rows) || rows.length === 0)
    return fail(response, 400, "22023", "invalid_rows");
  if (rows.length > 500) return fail(response, 400, "22023", "too_many_rows");
  if (!["skip", "update"].includes(body.p_on_duplicate ?? "skip")) {
    return fail(response, 400, "22023", "invalid_duplicate_mode");
  }
  const owner = body.p_owner_id ?? person.id;
  if (owner !== person.id && person.role !== "admin")
    return fail(response, 403, "42501", "forbidden");
  if (
    auth.imports.some(
      (entry) =>
        entry.owner_id === person.id &&
        entry.file_hash === body.p_file_hash &&
        entry.rows_created + entry.rows_updated > 0,
    )
  ) {
    return fail(response, 400, "P0001", "already_imported");
  }
  const counts = { created: 0, updated: 0, skipped: 0, invalid: 0 };
  const importId = randomUUID();
  for (const row of rows) {
    const name = neutral(row?.full_name);
    const email = String(row?.email ?? "").trim() || null;
    const phone = String(row?.phone ?? "").trim() || null;
    const kind = row?.kind || "prospect";
    if (
      !name ||
      !kinds.includes(kind) ||
      (email && !emailShape.test(email)) ||
      (phone && !phoneShape.test(phone))
    ) {
      counts.invalid += 1;
      continue;
    }
    const existing = email
      ? auth.contacts.find(
          (contact) =>
            contact.owner_id === owner && contact.email?.toLowerCase() === email.toLowerCase(),
        )
      : null;
    if (!existing) {
      auth.contacts.push({
        id: randomUUID(),
        full_name: name,
        organization: neutral(row.organization),
        email,
        phone,
        notes: neutral(row.notes),
        kind,
        source: "import",
        owner_id: owner,
        next_action: null,
        next_action_at: null,
        last_activity_at: null,
        created_at: new Date().toISOString(),
        deals: [],
      });
      counts.created += 1;
    } else if (body.p_on_duplicate === "update") {
      const fill = { phone, organization: neutral(row.organization), notes: neutral(row.notes) };
      const changed = Object.entries(fill).filter(([key, value]) => value && !existing[key]);
      for (const [key, value] of changed) existing[key] = value;
      if (changed.length > 0) counts.updated += 1;
      else counts.skipped += 1;
    } else {
      counts.skipped += 1;
    }
  }
  auth.imports.push({
    id: importId,
    owner_id: person.id,
    assigned_to: owner,
    file_name: body.p_file_name,
    file_hash: body.p_file_hash,
    rows_total: rows.length,
    rows_created: counts.created,
    rows_updated: counts.updated,
    rows_skipped: counts.skipped,
    rows_invalid: counts.invalid,
    created_at: new Date().toISOString(),
  });
  return send(response, 200, { import_id: importId, ...counts });
});
