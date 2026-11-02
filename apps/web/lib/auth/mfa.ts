/**
 * Whether the web guards ask for the second factor (`aal2`) of staff. Always, except when
 * `ADMIN_REQUIRE_MFA` is exactly `'false'`: a variable of the local and E2E runs (`apps/web/.dev.vars`, like the
 * gateway's), never set in the production environment, so the default there is the enforced one. The database
 * ignores it: RLS and the RPCs ask for `aal2` regardless (`private.is_aal2()`).
 */
export function mfaRequired(): boolean {
  return process.env.ADMIN_REQUIRE_MFA !== 'false';
}
