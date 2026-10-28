// ESLint flat config shared by the whole monorepo (working-agreements §14.5).
// Decided by Jose: eslint-config-next + typescript-eslint recommended, boundaries via
// no-restricted-imports, import-x (order, no-duplicates, no-cycle), jsx-no-literals.
// NOT included on purpose: consistent-type-imports, no-explicit-any as error, bans on
// React.FC / enums (Jose did not pick them).
import { createRequire } from 'node:module';

import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

// React version read from the installed package (needs `react` resolvable from this package).
const reactVersion = createRequire(import.meta.url)('react/package.json').version;

const webFiles = ['apps/web/**/*.{js,jsx,mjs,ts,tsx,mts,cts}'];

// --- no-restricted-imports (§14.5) -------------------------------------------------

const restrictions = {
  messages: {
    group: ['**/messages/**/*.json', '**/messages/es', '**/messages/en', '@/messages/*'],
    message:
      'Use useTranslations/getTranslations; never import the message catalogs (JSON or es/en modules) directly.',
    dynamic: '/messages\\/(?:.*\\.json|es|en)$/',
    dynamicTemplate: '/messages\\//',
  },
  database: {
    group: ['@josecoded/types/src/database', '**/types/src/database'],
    message:
      'Import Database, Tables<> and friends from @josecoded/types (db.ts), not database.ts.',
  },
  // inside packages/types only db.ts (and the drift test) may touch the generated file
  databaseLocal: {
    group: ['./database', './database.ts', '../database', '../src/database'],
    message: 'Only db.ts and the drift test import the generated database.ts.',
  },
  tokens: {
    group: ['**/styles/tokens.css'],
    message: 'tokens.css is imported only by globals.css.',
  },
  three: {
    group: ['three', 'three/*'],
    message: 'three is allowed only inside packages/glyph-scene.',
    dynamic: '/^three(\\/|$)/',
  },
  supabase: {
    group: ['@supabase/supabase-js'],
    message:
      'supabase-js is allowed only in apps/web/lib/supabase/, apps/api/src/adapters/ and apps/web/tests/helpers/ (use the typed clients).',
    dynamic: '/^@supabase\\/supabase-js$/',
  },
  // import(variable) / import(`…${x}`): the path cannot be checked, so it is only allowed where the
  // module list is deliberately closed (i18n loaders, the glyph-scene worker)
  dynamicImports: {
    selector: "ImportExpression[source.type!='Literal']",
    message:
      'Dynamic import() needs a literal path: the boundaries above cannot be checked otherwise.',
  },
  adapters: {
    group: ['**/adapters/*', '**/adapters'],
    message: 'Routes receive deps (buildDeps(env)); they never import adapters.',
  },
};

/**
 * Static imports go through no-restricted-imports; dynamic `import()` through
 * no-restricted-syntax (same exceptions by `files`).
 * @param {Array<keyof typeof restrictions>} ids
 */
const restrict = (ids) => {
  const picked = ids.map((id) => restrictions[id]);
  return {
    'no-restricted-imports': [
      'error',
      {
        patterns: picked
          .filter((r) => 'group' in r)
          .map(({ group, message }) => ({ group, message })),
      },
    ],
    'no-restricted-syntax': [
      'error',
      ...picked.flatMap((r) => [
        ...('selector' in r ? [{ selector: r.selector, message: r.message }] : []),
        ...('dynamic' in r
          ? [{ selector: `ImportExpression[source.value=${r.dynamic}]`, message: r.message }]
          : []),
        // import(`../messages/${locale}.json`): the path lives in a template literal quasi
        ...('dynamicTemplate' in r
          ? [
              {
                selector: `ImportExpression > TemplateLiteral > TemplateElement[value.raw=${r.dynamicTemplate}]`,
                message: r.message,
              },
            ]
          : []),
      ]),
    ],
  };
};

const everywhere = ['messages', 'database', 'tokens', 'three', 'supabase', 'dynamicImports'];
const without = (/** @type {string[]} */ ...ids) => everywhere.filter((x) => !ids.includes(x));

const boundaries = [
  { files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'], rules: restrict(everywhere) },
  // gateway routes: all of the above plus «no adapters»
  { files: ['apps/api/src/modules/**'], rules: restrict([...everywhere, 'adapters']) },
  // generated database.ts: only db.ts and the drift test may import it
  { files: ['packages/types/**'], rules: restrict([...everywhere, 'databaseLocal']) },
  {
    files: ['packages/types/src/db.ts', 'packages/types/test/database-drift.test.ts'],
    rules: restrict(everywhere),
  },
  // the only places where each thing is legitimate
  {
    files: ['apps/web/messages/**', 'apps/web/i18n/**'],
    rules: restrict(without('messages', 'dynamicImports')),
  },
  { files: ['packages/glyph-scene/**'], rules: restrict(without('three', 'dynamicImports')) },
  {
    files: ['apps/web/lib/supabase/**', 'apps/api/src/adapters/**', 'apps/web/tests/helpers/**'],
    rules: restrict(without('supabase')),
  },
];

// --- legacy gateway (heredado, intocable) ----------------------------------------------------------
// The code moved from josedev/josecoded-api keeps its contracts and its shape: working-agreements §17.1
// (ports and adapters) only applies to NEW modules. This is the LITERAL list of the files copied from the
// origin (task 1.2), not directories: a new file anywhere under apps/api (even in services/ or utils/) is
// linted in full. src/index.ts is not here: it is shared with the new modules and follows every rule.
// Rules switched off for the list: the ones this repo added (boundaries, import order) plus
// no-unused-vars, which the legacy code already breaks. The only `any` without a disable comment
// is switched off for its own file below, so the unused-directive check stays on everywhere else.
const legacyApi = [
  'apps/api/scripts/wrangler-dev.mjs',
  'apps/api/src/config/env.ts',
  'apps/api/src/forum-moderation.contract.test.ts',
  'apps/api/src/index.test.ts',
  'apps/api/src/middlewares/auth.middleware.ts',
  'apps/api/src/middlewares/native-rate-limit.middleware.test.ts',
  'apps/api/src/middlewares/native-rate-limit.middleware.ts',
  'apps/api/src/middlewares/security.middleware.test.ts',
  'apps/api/src/middlewares/security.middleware.ts',
  'apps/api/src/modules/admin-chat-admin.routes.test.ts',
  'apps/api/src/modules/admin-chat-admin.routes.ts',
  'apps/api/src/modules/admin-chat.routes.ts',
  'apps/api/src/modules/dev-worker-proxy.routes.ts',
  'apps/api/src/modules/forum.routes.ts',
  'apps/api/src/modules/health.routes.ts',
  'apps/api/src/modules/system.routes.ts',
  'apps/api/src/modules/v1-protected.routes.ts',
  'apps/api/src/modules/v1.routes.ts',
  'apps/api/src/schemas/admin-chat-admin.schema.ts',
  'apps/api/src/schemas/admin-chat.schema.ts',
  'apps/api/src/schemas/forum.schema.ts',
  'apps/api/src/services/admin-chat-assistant.service.test.ts',
  'apps/api/src/services/admin-chat-assistant.service.ts',
  'apps/api/src/services/admin-chat-n8n.service.ts',
  'apps/api/src/services/admin-chat-notify.service.test.ts',
  'apps/api/src/services/admin-chat-notify.service.ts',
  'apps/api/src/services/admin-chat.pg-store.test.ts',
  'apps/api/src/services/admin-chat.pg-store.ts',
  'apps/api/src/services/ai-reply.test.ts',
  'apps/api/src/services/ai-reply.ts',
  'apps/api/src/services/forum-moderation.service.ts',
  'apps/api/src/services/forum.mock-store.ts',
  'apps/api/src/services/forum.pg-store.ts',
  'apps/api/src/services/forum.store.test.ts',
  'apps/api/src/services/forum.store.ts',
  'apps/api/src/services/knowledge.test.ts',
  'apps/api/src/services/knowledge.ts',
  'apps/api/src/services/supabase.service.test.ts',
  'apps/api/src/services/supabase.service.ts',
  'apps/api/src/services/worker.service.ts',
  'apps/api/src/types/admin-chat.types.ts',
  'apps/api/src/types/env.types.ts',
  'apps/api/src/types/forum.types.ts',
  'apps/api/src/utils/api-response.ts',
  'apps/api/src/utils/forum-slug.test.ts',
  'apps/api/src/utils/forum-slug.ts',
  'apps/api/src/utils/forum-user.ts',
];

const legacyGateway = {
  files: legacyApi,
  rules: {
    'no-restricted-imports': 'off',
    'no-restricted-syntax': 'off',
    'import-x/order': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
};

const legacyAny = {
  files: ['apps/api/src/middlewares/native-rate-limit.middleware.test.ts'],
  rules: { '@typescript-eslint/no-explicit-any': 'off' },
};

// --- the boundaries cannot be switched off with a comment ------------------------------------------

const noSilencing = {
  files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
  plugins: { '@eslint-community/eslint-comments': eslintComments },
  linterOptions: { reportUnusedDisableDirectives: 'error' },
  rules: {
    '@eslint-community/eslint-comments/no-restricted-disable': [
      'error',
      'no-restricted-imports',
      'no-restricted-syntax',
    ],
    // a blanket `eslint-disable` would switch the boundaries off too
    '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
  },
};

// --- import-x (order, duplicates, cycles) --------------------------------------------

const importRules = {
  files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
  plugins: { 'import-x': importX },
  settings: {
    'import-x/extensions': ['.ts', '.tsx', '.cts', '.mts', '.js', '.jsx', '.cjs', '.mjs'],
    'import-x/external-module-folders': ['node_modules', 'node_modules/@types'],
    'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx', '.cts', '.mts'] },
    'import-x/resolver-next': [
      createNodeResolver({
        extensions: ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.json'],
      }),
    ],
  },
  rules: {
    'import-x/order': [
      'error',
      {
        groups: ['builtin', 'external', ['parent', 'sibling', 'index'], 'type'],
        pathGroups: [
          { pattern: '@josecoded/**', group: 'external', position: 'after' },
          // project alias (apps/web): after the workspace packages, before relative imports
          { pattern: '@/**', group: 'parent', position: 'before' },
        ],
        pathGroupsExcludedImportTypes: ['builtin', 'type'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import-x/no-duplicates': 'error',
    'import-x/no-cycle': ['error', { maxDepth: 4, ignoreExternal: true }],
  },
};

// --- apps/web: eslint-config-next + literals in JSX ----------------------------------

const web = nextCoreWebVitals.map((config) =>
  // global-ignore entries (only `ignores`) stay global; the rest apply to apps/web only
  Object.keys(config).length === 1 && 'ignores' in config ? config : { ...config, files: webFiles },
);
web.push({
  files: webFiles,
  // eslint-plugin-react 7.37 cannot auto-detect the version under ESLint 10 (it calls the removed
  // context.getFilename), so the version is explicit. Revisit when the plugin supports ESLint 10.
  settings: { react: { version: reactVersion } },
  // App Router only: there is no pages/ directory for this rule to check.
  rules: { '@next/next/no-html-link-for-pages': 'off' },
});

const noLiteralsInJsx = {
  files: ['apps/web/**/*.tsx'],
  ignores: ['**/*.test.tsx', 'apps/web/e2e/**'],
  rules: {
    'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true }],
  },
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.open-next/**',
      '**/.wrangler/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/coverage/**',
      '**/graphify-out/**',
      '.claude/**',
      '**/fixtures/**',
      '**/database.ts',
      // generated by @josecoded/design-tokens
      '**/styles/tokens.ts',
      '**/styles/breakpoints.ts',
    ],
  },
  ...tseslint.configs.recommended,
  ...web,
  importRules,
  ...boundaries,
  legacyGateway,
  legacyAny,
  noSilencing,
  noLiteralsInJsx,
);
