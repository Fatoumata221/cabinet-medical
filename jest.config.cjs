module.exports = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Racines des tests
  roots: ['<rootDir>/src'],
  
  // Extensions de fichiers à traiter
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  
  // Transformateurs
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Modules à ignorer
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
  },
  
  // Setup des tests
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.js',
  ],
  
  // Collecte de couverture
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/tests/**/*',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Répertoires de tests
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Répertoires à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  
  // Variables d'environnement pour les tests
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  
  // Timeout des tests
  testTimeout: 10000,
  
  // Verbosité
  verbose: true,
  
  // Cache
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Réinitialisation des mocks entre les tests
  clearMocks: true,
  
  // Restauration des mocks
  restoreMocks: true,
  
  // Collecte de couverture
  collectCoverage: true,
  
  // Répertoire de couverture
  coverageDirectory: 'coverage',
  
  // Formats de couverture
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
  ],
  
  // Modules à transformer
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react|@supabase)/)',
  ],
  
  // Extensions de modules
  moduleDirectories: [
    'node_modules',
    'src',
  ],
  
  // Setup global
  globalSetup: '<rootDir>/src/tests/globalSetup.js',
  
  // Teardown global
  globalTeardown: '<rootDir>/src/tests/globalTeardown.js',
  
  // Réinitialisation des modules
  resetModules: true,
  
  // Détection des changements
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
  ],
  
  // Notifications
  notify: true,
  
  // Mode watch
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

