const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");

module.exports = {
    entry: "./src/clicker.ts",
    devtool: "inline-source-map",
    mode: "development",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: ["@babel/preset-typescript"],
                    plugins: [
                        "transform-inline-scss",
                        "@babel/plugin-syntax-dynamic-import",
                        "@babel/plugin-proposal-class-properties",
                        "@babel/plugin-transform-react-jsx",
                        "@babel/plugin-syntax-bigint",
                        "@babel/plugin-proposal-numeric-separator",
                        "@babel/plugin-proposal-nullish-coalescing-operator",
                        "@babel/plugin-proposal-logical-assignment-operators",
                    ],
                },
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new ProgressBarPlugin(),
        new HTMLWebpackPlugin({
            title: "clicker",
            template: "public/index.html",
        }),
        new CopyPlugin([
            {
                from: path.resolve(__dirname, "public"),
                to: path.resolve(__dirname, "dist"),
                ignore: ["index.html"],
            },
        ]),
    ],
};
