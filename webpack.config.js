const path = require('path');

module.exports = [{
  devtool: 'source-map',
  //generate inkmap.js lib with umd target to run in browser window
  entry: {
    inkmap: path.resolve(__dirname, './src/main/index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: '@camptocamp/inkmap',
    libraryTarget: 'umd',
  },
  module: getBabelLoader()
},
{
  devtool: 'source-map',
  //generate inkmap-worker.js without umd target to run in background
  entry: {
    ['inkmap-worker']: path.resolve(
      __dirname,
      'src',
      'worker',
      'index.js'
    ),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: getBabelLoader()
}];

function getBabelLoader() {
  return {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env']
            ],
            // transpile promises to ES5 ("regeneratorRuntime is not defined")
            plugins: [
              [
                "@babel/plugin-transform-runtime",
                {
                  "regenerator": true,
                }
              ]
            ]
          },
        },
      },
    ],
  };
}