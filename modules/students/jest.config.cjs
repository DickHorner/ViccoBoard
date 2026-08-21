module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@viccoboard/core$': '<rootDir>/../../packages/core/src',
    '^@viccoboard/storage$': '<rootDir>/../../packages/storage/src',
    // uuid v14 is ESM-only; provide a CJS-compatible stub for Jest
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.cjs',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // ts-jest 29 is incompatible with TypeScript 7 (ESM-only, no compiler APIs at CJS entry).
        // Use the compatible TypeScript 6 from the workspace root node_modules.
        compiler: require.resolve('typescript', { paths: [require('path').resolve(__dirname, '../../')] }),
        useESM: false,
        tsconfig: {
          lib: ['ES2020', 'DOM'],
          types: ['jest', 'node'],
          allowSyntheticDefaultImports: true,
          esModuleInterop: true
        }
      }
    ]
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
