module.exports = {
  transformIgnorePatterns: [],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  collectCoverage: true,
  setupFiles: ['jest-canvas-mock']
};
