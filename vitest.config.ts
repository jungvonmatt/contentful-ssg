import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.{test,spec}.{ts,js}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/__test__/**'],
    globals: true,
    pool: 'forks',
    testTimeout: 30000,
    reporters: process.env.CI
      ? ['default', ['vitest-sonar-reporter', { outputFile: 'coverage/test-report.xml' }]]
      : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'clover', 'json', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['packages/*/src/**/*.{ts,js}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__test__/**',
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
        'packages/contentful-ssg/src/lib/config.ts',
        'packages/contentful-ssg/src/lib/create-require.ts',
        'packages/cssg-plugin-hugo/**/*',
        'packages/cssg-plugin-grow/**/*',
      ],
    },
  },
  resolve: {
    // Allow .js imports to resolve to .ts source
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },
});
