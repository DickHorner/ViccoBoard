module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Browser-like environment for Vue tests
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@viccoboard/core$': '<rootDir>/../../packages/core/src/interfaces/core.types.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^perfect-debounce$': '<rootDir>/tests/__mocks__/perfect-debounce.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,vue}',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/i18n/locales/**',
  ],
  setupFilesAfterEnv: [],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!(vue-i18n)/)',
  ],
};
