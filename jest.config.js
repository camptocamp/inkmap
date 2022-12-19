module.exports = {
  transformIgnorePatterns: [],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  collectCoverage: true,
  setupFiles: ['jest-canvas-mock']
};
