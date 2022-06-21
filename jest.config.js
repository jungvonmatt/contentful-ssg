export default {
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
