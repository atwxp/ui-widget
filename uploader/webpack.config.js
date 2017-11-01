var path = require('path');

// OSX & Linux => '/', Windows => '\\'
var abs = function (p) {
    return path.join(__dirname, p);
};

// path for source
var srcPath = abs('src');

module.exports = {
    context: srcPath,

    entry: path.join(srcPath, 'index/index.js'),

    output: {
        path: abs('output'),
        filename: 'index.js'
    },

    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.less$/,
                loader: 'style-loader!css-loader!less-loader'
            },
            {
                test: /\.png|\.jpeg|\.gif/,
                loader: 'url'
            }
        ]
    },

    resolve: {
        alias: {
            util: path.join(srcPath, 'util')
        }
    }
};
