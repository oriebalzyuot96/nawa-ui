/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  testMatch: ['<rootDir>/test/**/*.test.tsx'],
  setupFilesAfterEnv: ['@testing-library/react-native/extend-expect'],
  // react-native and @react-native/* ship untranspiled Flow/ESM; @pelagic-ui/core ships ESM tokens.
  transformIgnorePatterns: ['node_modules[\\/](?!((jest-)?react-native|@react-native(-community)?|@pelagic-ui)[\\/])'],
};
