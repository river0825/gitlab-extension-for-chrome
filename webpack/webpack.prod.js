const merge = require('webpack-merge');
const ZipPlugin = require('zip-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new ZipPlugin({
            path: '../../artifact',
            filename: "gitlab-extension",
            pathPrefix: './dist/'
        })
    ]
})
