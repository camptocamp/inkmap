const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    app: path.resolve(__dirname, 'index.js'),
    ['inkmap-worker']: path.resolve(
      __dirname,
      '..',
      'src',
      'worker',
      'index.js'
    ),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html'),
      inject: false,
    }),
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: __dirname,
  },
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
