const path = require('path')

module.exports = {
    mode: 'development',
    entry: {
        app: path.resolve(__dirname, 'index.js'),
        ['inkmap-worker']: path.resolve(__dirname, '..', 'src', 'worker', 'index.js'),
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    plugins: [],
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
                        presets: [
                            [
                                '@babel/preset-env',
                                { targets: { node: '10' } }
                            ]
                        ],
                    },
                },
            }
        ],
    },
}
