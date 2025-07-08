import fs from 'fs';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const example01 = fs.readFileSync(
  path.resolve(__dirname, 'examples/01-simple.js'),
);
const example02 = fs.readFileSync(
  path.resolve(__dirname, 'examples/02-progress.js'),
);
const example03 = fs.readFileSync(
  path.resolve(__dirname, 'examples/03-cancel.js'),
);
const example04 = fs.readFileSync(
  path.resolve(__dirname, 'examples/04-jobs.js'),
);
const example05 = fs.readFileSync(
  path.resolve(__dirname, 'examples/05-pdf.js'),
);
const example06 = fs.readFileSync(
  path.resolve(__dirname, 'examples/06-projection.js'),
);
const example07 = fs.readFileSync(
  path.resolve(__dirname, 'examples/07-errors.js'),
);
const example08 = fs.readFileSync(
  path.resolve(__dirname, 'examples/08-legends.js'),
);

export default {
  mode: 'development',
  entry: {
    app: path.resolve(__dirname, 'index.js'),
    ['inkmap-worker']: path.resolve(
      __dirname,
      '..',
      'src',
      'worker',
      'index.js',
    ),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html'),
      templateParameters: {
        example01,
        example02,
        example03,
        example04,
        example05,
        example06,
        example07,
        example08,
      },
      inject: false,
    }),
  ],
  devtool: 'source-map',
  devServer: {
    static: { directory: __dirname },
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
  resolve: {
    alias: {
      '@camptocamp/inkmap$': '../../src/main',
    },
  },
};
