module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Browser-like environment for Vue tests
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.tsx?$': ['ts-jest', {
      // ts-jest 29 requires TypeScript 6's compiler APIs (ts.sys, findConfigFile).
      // TypeScript 7 (installed locally) removed these in favour of the ./unstable/* ESM API.
      // Point ts-jest at the compatible TypeScript 6 in the workspace root node_modules.
      compiler: require.resolve('typescript', { paths: [require('path').resolve(__dirname, '../../')] }),
      tsconfig: {
        target: 'ES2020',
        module: 'CommonJS',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: true,
        types: ['jest', '@types/jest', 'node'],
        ignoreDeprecations: '6.0'
      },
      diagnostics: false
    }],
    '^.+\\.m?jsx?$': ['ts-jest', {
      compiler: require.resolve('typescript', { paths: [require('path').resolve(__dirname, '../../')] }),
      useESM: false,
      tsconfig: {
        target: 'ES2020',
        module: 'CommonJS',
        allowJs: true
      },
      diagnostics: false
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
    'node_modules/(?!(vue-i18n|pinia|vue-router|nostics)/)',
  ],
};
