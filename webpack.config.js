const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

module.exports = {
  entry: './assets/index.js',
  output: {
    filename: 'components.js',
    path: path.resolve(__dirname, 'assets'),
  },module: {
    rules: [
        {
            test: /\.js$/,
            use: {
                loader: "babel-loader",
            }
        },
        {
            test: /\.s?css$/,
            use: [
              MiniCssExtractPlugin.loader,
              "css-loader",
              "sass-loader"
            ]
        }
    ]
},
plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
]
};