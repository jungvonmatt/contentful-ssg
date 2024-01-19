/** @type {import('jest').Config} */
export default {
  maxConcurrency: 1,
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
  coverageProvider: 'v8',
  collectCoverage: true,
  coverageReporters: ['text', 'clover', 'json', 'lcov'],
  testResultsProcessor: 'jest-sonar-reporter',
  projects: [
    '<rootDir>/packages/contentful-fakes',
    '<rootDir>/packages/contentful-ssg',
    '<rootDir>/packages/cssg-plugin-assets',
    '<rootDir>/packages/cssg-plugin-grow',
    '<rootDir>/packages/cssg-plugin-hugo',
  ],
};
