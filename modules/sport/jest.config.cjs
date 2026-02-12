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
    // Handle .js extensions in TypeScript imports (resolve to .ts)
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  }
};
