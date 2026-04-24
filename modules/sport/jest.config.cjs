module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  moduleNameMapper: {
    '^@viccoboard/core$': '<rootDir>/../../packages/core/src',
    '^@viccoboard/storage/node$': '<rootDir>/../../packages/storage/src/node.ts',
    '^@viccoboard/storage$': '<rootDir>/../../packages/storage/src',
    '^@viccoboard/plugins$': '<rootDir>/../../packages/plugins/src',
    '^@viccoboard/students$': '<rootDir>/../../modules/students/src',
    // uuid v14 is ESM-only; provide a CJS-compatible stub for Jest
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.cjs',
    // Handle .js extensions in TypeScript imports (resolve to .ts)
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        lib: ['ES2020', 'DOM'],
        types: ['jest', 'node'],
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  }
};
