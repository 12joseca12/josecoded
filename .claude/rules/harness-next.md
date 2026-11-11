---
paths: ["src/**/*.ts", "src/**/*.tsx", "app/**/*.ts", "app/**/*.tsx"]
---
<!-- Generado por /harness (claude-config). No editar: se sobrescribe en /harness update. -->
# Patrones Next.js (App Router, React 19)

Si el `CLAUDE.md` del proyecto o sus documentos de decisiones dicen otra cosa, manda el proyecto. Para excluir esta regla: `omitir` en `.claude/harness.json`.

Las librerías citadas aplican si ya están en `package.json`; añadir una nueva necesita aprobación del proyecto.

- Antes de usar una API de Next, consulta la documentación de la versión instalada en `node_modules/next/dist/docs/` (a la que remite `AGENTS.md`); manda sobre lo que recuerdes.
- Server Components por defecto. `'use client'` solo en hojas interactivas: nunca en `layout.tsx` ni `page.tsx`; pasa a la hoja solo props serializables.
- `params` y `searchParams` son `Promise`: `await` en la página, no en el cliente.
- Datos en el servidor, no en `useEffect`. Peticiones independientes con `Promise.all`; sin cascadas `await` tras `await`. Lo lento va tras `<Suspense>` con fallback propio (streaming).
- Server Actions (`'use server'`): valida la entrada con zod dentro de la acción y comprueba sesión y permisos ahí; es un endpoint público.
- Caché explícita, nunca implícita: con `cacheComponents`, `'use cache'` con `cacheLife` y `cacheTag`. Lee `cookies()` y `headers()` fuera del ámbito cacheado y pásalos como argumentos.
- Invalidar tras mutar: Server Action que lee lo que acaba de escribir, `updateTag(tag)`; Route Handler o datos que pueden llegar algo tarde, `revalidateTag(tag, 'max')`; `revalidatePath` para rutas sin etiqueta. `router.refresh()` solo refresca el cliente.
- Estructura por feature salvo que el proyecto fije otra: componentes, acciones y consultas de una feature juntos; `app/` solo enruta y compone.
- Container queries para componentes reutilizables; media queries solo para el layout de página.
- Transiciones de ruta con `<ViewTransition>` de React; las animaciones CSS propias de `::view-transition-*` usan solo `transform` y `opacity`.
- Imágenes con `next/image`: `sizes` en las responsive y `alt` real. En la imagen LCP, `loading="eager"` o `fetchPriority="high"`; `preload` solo si es una única LCP fija (`priority` está obsoleta).
- Fuentes locales con `next/font/local` o `next/font`; nada de `<link>` a Google Fonts.
- Errores con `error.tsx` y `not-found.tsx` por segmento; `loading.tsx` donde haya streaming.
