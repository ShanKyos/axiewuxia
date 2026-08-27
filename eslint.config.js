import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['api/**'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // src/components/ui/** is unmodified shadcn/ui ("new-york" style) output — every file
    // pairs a component with a `cva()` variants helper exported from the same module (the
    // standard shadcn pattern used across virtually every project built on it), which trips
    // react-refresh/only-export-components; sidebar.tsx's Math.random() inside a []-deps
    // useMemo (a one-time skeleton-width pick on mount) trips the newer purity rule. Both are
    // accepted, well-understood patterns in generated library code, not app bugs to refactor —
    // regenerating these files via `npx shadcn add` would reproduce the same shapes.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    // Backend (Hono/tRPC) — previously not linted at all (the old glob matched it, but nothing
    // ever ran lint against it in CI, and its Node globals/require-await patterns differ from
    // the frontend). Node globals instead of browser; no React-only plugins.
    files: ['api/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  {
    // public/game/game.js was previously invisible to lint entirely (the old **/*.{ts,tsx}
    // glob only ever matched the React shell). It's plain classic-script JS (not a module),
    // sharing global scope at runtime with i18n.js/lang.js/strings/*.js loaded alongside it —
    // functions assigned via `window.fn = function(){}` in those sibling files (and in this
    // one) are real globals at runtime but invisible to ESLint's static no-undef check without
    // being declared here explicitly.
    files: ['public/game/game.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // window.fn = function(){} globals from i18n.js / this file's own onclick-bound handlers
        t: 'readonly', chooseSect: 'readonly', forgeUseCharm: 'readonly', hintHide: 'readonly',
        openSectCeremony: 'readonly', qzFlip: 'readonly', qzShuffle: 'readonly',
        qzToggle: 'readonly', renderStable: 'readonly', respawn: 'readonly',
        toggleAuto: 'readonly', toggleMountOut: 'readonly', travelTo: 'readonly',
        tryCatchHorse: 'readonly', tryTame: 'readonly',
      },
    },
    rules: {
      // A handful of function params are kept unused for signature-parity with a sibling
      // function, or reserved for a not-yet-wired follow-up effect — prefixed with _ to mark
      // that deliberately, same convention as everywhere else in the ecosystem.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
])
