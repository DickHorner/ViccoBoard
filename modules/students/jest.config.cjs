module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  forceExit: true,
  moduleNameMapper: {
    '^@viccoboard/core$': '<rootDir>/../../packages/core/src',
    '^@viccoboard/storage$': '<rootDir>/../../packages/storage/src',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
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
