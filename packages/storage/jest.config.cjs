module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@viccoboard/core$': '<rootDir>/../../packages/core/src',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // ts-jest 29 is incompatible with TypeScript 7 (ESM-only, no compiler APIs at CJS entry).
      // Use the compatible TypeScript 6 from the workspace root node_modules.
      compiler: require.resolve('typescript', { paths: [require('path').resolve(__dirname, '../../')] }),
      useESM: false,
      tsconfig: {
        types: ['jest', 'node'],
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ]
};
