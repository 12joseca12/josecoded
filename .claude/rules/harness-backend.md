---
paths: ["supabase/**", "src/**/*.ts"]
---
<!-- Generado por /harness (claude-config). No editar: se sobrescribe en /harness update. -->
# Patrones de backend (Supabase)

Si el `CLAUDE.md` del proyecto o sus documentos de decisiones dicen otra cosa, manda el proyecto. Para excluir esta regla: `omitir` en `.claude/harness.json`.

Las librerías citadas aplican si ya están en `package.json`; añadir una nueva necesita aprobación del proyecto.

- Monolito modular: un despliegue, módulos por dominio con fronteras claras. Nada de microservicios sin una razón medida.
- Reglas de negocio en la base de datos (RLS, funciones, triggers, `check`), una sola vez; el cliente no las duplica, solo muestra el error.
- RLS activa en toda tabla de `public`, en la misma migración que su `create table`. Sin policy, nadie accede; evita `using (true)`.
- En policies, `(select auth.uid())` envuelto en `select` y un índice en cada columna que usen. Cada policy tiene su test (pgTAP).
- Funciones `security definer` con `set search_path = ''` y nombres cualificados; `revoke execute ... from public, anon` y `grant` explícito solo a quien deba.
- Migraciones SQL versionadas en `supabase/migrations/`; una aplicada no se edita, se añade otra. Tipos regenerados tras cada cambio de esquema.
- La clave `service_role` solo en servidor y en funciones; nunca en cliente ni en variables `NEXT_PUBLIC_*` o `EXPO_PUBLIC_*`.
- Adaptadores solo en integraciones externas (pagos, correo, terceros): una interfaz propia en la frontera. Lo interno se llama directo.
- Trabajo lento o reintentable (correo, webhooks, IA, importaciones) a una cola, con clave de idempotencia; los webhooks verifican la firma antes de actuar.
- Consultas con las columnas que necesitas (no `select *`) y con `limit`; paginación por cursor en listas grandes.
