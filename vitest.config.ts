import { defineConfig } from 'vitest/config';

/**
 * Extra runner settings on top of the config `@angular/build:unit-test` generates
 * (see angular.json → architect.test). The only reason this file exists: the builder
 * writes coverage to coverage/<project>/, while `guardian verify` reads
 * coverage/coverage-final.json — so the report is redirected to coverage/.
 */
export default defineConfig({
  test: {
    coverage: {
      reportsDirectory: 'coverage',
    },
  },
});
