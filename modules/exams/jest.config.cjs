const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@viccoboard/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@viccoboard/plugins$': '<rootDir>/../../packages/plugins/src/index.ts',
    '^@viccoboard/storage/node$': '<rootDir>/../../packages/storage/src/node.ts',
    '^@viccoboard/storage$': '<rootDir>/../../packages/storage/src/index.ts',
    '^@viccoboard/students$': '<rootDir>/../../modules/students/src/index.ts',
    '^@viccoboard/sport$': '<rootDir>/../../modules/sport/src/index.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext'
      }
    }]
  },
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ]
};
