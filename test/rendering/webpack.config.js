import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  mode: 'development',
  devtool: 'source-map',
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
            presets: [['@babel/preset-env', { targets: { node: '20' } }]],
          },
        },
      },
      {
        test: /\.js$/,
        resolve: { fullySpecified: false },
      },
    ],
  },
};
