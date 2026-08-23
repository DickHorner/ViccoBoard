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
    '^@viccoboard/sport$': '<rootDir>/../../modules/sport/src/index.ts',
    // uuid v14 is ESM-only; provide a CJS-compatible stub for Jest
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.cjs'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // ts-jest 29 is incompatible with TypeScript 7 (ESM-only, no compiler APIs at CJS entry).
        // Use the compatible TypeScript 6 from the workspace root node_modules.
        compiler: require.resolve('typescript', { paths: [require('path').resolve(__dirname, '../../')] }),
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          types: ['jest', 'node']
        },
        diagnostics: false
      }
    ]
  },
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts']
};
