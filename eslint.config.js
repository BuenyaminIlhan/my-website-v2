// Guardian quality baseline for Angular projects (flat config, angular-eslint >= 18).
// Install: ng add angular-eslint   (adds eslint + angular-eslint + typescript-eslint)
// Then replace the generated eslint.config.js with this file, or merge the "rules" blocks.
// Every rule is an ERROR on purpose: warnings are ignored by agents.
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  { ignores: ['dist/**', 'coverage/**', '.angular/**', '.nx/**', 'public/**'] },
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked, ...angular.configs.tsRecommended],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } },
    processor: angular.processInlineTemplates,
    rules: {
      // --- no hallucination / no escape hatches -------------------------
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      // --- maintainability: small units ---------------------------------
      complexity: ['error', 10],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'no-nested-ternary': 'error',
      // --- modern Angular --------------------------------------------------
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/no-host-metadata-property': 'off',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }]
    }
  },
  {
    files: ['**/*.spec.ts'],
    rules: { 'max-lines-per-function': 'off', '@typescript-eslint/no-unsafe-assignment': 'off', '@typescript-eslint/unbound-method': 'off' }
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/use-track-by-function': 'error',
      '@angular-eslint/template/no-any': 'error',
      // Off by decision (2026-08-26): 66 of this rule's 236 hits in this codebase were plain
      // signal reads (activeProject(), menuOpen(), …), which the rule cannot tell apart from
      // real method calls — it only offers allowList/allowPrefix/allowSuffix, and signal names
      // share no pattern. The other 170 are the i18n lookups lang.t()/link()/pagePath(); with
      // OnPush on every component those only re-evaluate on views that are actually dirty.
      '@angular-eslint/template/no-call-expression': 'off'
    }
  }
);
