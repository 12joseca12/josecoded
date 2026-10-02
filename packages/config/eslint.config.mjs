// ESLint flat config shared by the whole monorepo (working-agreements §14.5).
// Decided by Jose: eslint-config-next + typescript-eslint recommended, boundaries via
// no-restricted-imports, import-x (order, no-duplicates, no-cycle), jsx-no-literals.
// NOT included on purpose: consistent-type-imports, no-explicit-any as error, bans on
// React.FC / enums (Jose did not pick them).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

const webFiles = ['apps/web/**/*.{js,jsx,mjs,ts,tsx,mts,cts}'];

// --- no-restricted-imports (§14.5) -------------------------------------------------

const restrictions = {
  messages: {
    group: ['**/messages/**/*.json'],
    message: 'Use useTranslations/getTranslations; never import messages JSON directly.',
  },
  database: {
    group: ['@josecoded/types/src/database', '**/types/src/database', '**/database'],
    message:
      'Import Database, Tables<> and friends from @josecoded/types (db.ts), not database.ts.',
  },
  tokens: {
    group: ['**/styles/tokens.css'],
    message: 'tokens.css is imported only by globals.css.',
  },
  three: {
    group: ['three', 'three/*'],
    message: 'three is allowed only inside packages/glyph-scene.',
  },
  supabase: {
    group: ['@supabase/supabase-js'],
    message:
      'supabase-js is allowed only in apps/web/lib/supabase/ and apps/api/src/adapters/ (use the typed clients).',
  },
  adapters: {
    group: ['**/adapters/*', '**/adapters'],
    message: 'Routes receive deps (buildDeps(env)); they never import adapters.',
  },
};

/** @param {Array<keyof typeof restrictions>} ids */
const restrict = (ids) => ({
  'no-restricted-imports': ['error', { patterns: ids.map((id) => restrictions[id]) }],
});

const everywhere = ['messages', 'database', 'tokens', 'three', 'supabase'];
const without = (/** @type {string} */ id) => everywhere.filter((x) => x !== id);

const boundaries = [
  { files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'], rules: restrict(everywhere) },
  // gateway routes: all of the above plus «no adapters»
  { files: ['apps/api/src/modules/**'], rules: restrict([...everywhere, 'adapters']) },
  // the only places where each thing is legitimate
  { files: ['apps/web/messages/**', 'apps/web/i18n/**'], rules: restrict(without('messages')) },
  { files: ['packages/glyph-scene/**'], rules: restrict(without('three')) },
  {
    files: ['apps/web/lib/supabase/**', 'apps/api/src/adapters/**'],
    rules: restrict(without('supabase')),
  },
];

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
        pathGroups: [{ pattern: '@josecoded/**', group: 'external', position: 'after' }],
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
  settings: { react: { version: '19.3' } },
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
    ],
  },
  ...tseslint.configs.recommended,
  ...web,
  importRules,
  ...boundaries,
  noLiteralsInJsx,
);
