import path from 'path';
import webpack from 'webpack';
import HTMLWebpackPlugin from 'html-webpack-plugin';

export default {
  context: path.resolve(__dirname, 'src'),

  entry: './index.js',

  output: {
    path: path.resolve(__dirname, 'dist'),

    filename: 'bundle.js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: '/node_modules/',
        use: 'babel-loader'
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      }
    ]
  },

  devtool: 'source-map',

  devServer: {
    disableHostCheck: true,
    contentBase: path.join(__dirname, 'dist'),
    host: '0.0.0.0',
    port: 9000
  },

  plugins: [
    new HTMLWebpackPlugin({
      template: 'index.html'
    })
  ]
}
