const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    print: path.resolve(__dirname, 'testbench/print.js'),
    ['inkmap-worker']: path.resolve(__dirname, '../../src/worker/index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  watch: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { node: '10' } }]],
          },
        },
      },
    ],
  },
};
