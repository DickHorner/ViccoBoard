module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@viccoboard/core$': '<rootDir>/../../packages/core/src',
    '^@viccoboard/storage$': '<rootDir>/../../packages/storage/src',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          allowJs: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true
        }
      }
    ]
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
