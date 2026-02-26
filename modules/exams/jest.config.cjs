module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
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
    '^.+\\.[tj]sx?$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        allowJs: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  },
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ]
};
