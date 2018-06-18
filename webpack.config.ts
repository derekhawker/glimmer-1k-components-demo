import * as path from "path";
import * as UglifyJsPlugin from "uglifyjs-webpack-plugin";
import * as webpack from "webpack";
import {BundleAnalyzerPlugin} from "webpack-bundle-analyzer";

type NodeEnv = { dev: boolean; prod: boolean; test: boolean };

export default function(env: NodeEnv): webpack.Configuration {
    let plugins = [];
    if (env.prod) {
        plugins.push(new BundleAnalyzerPlugin());
    }

    return {
        entry: { "index": "./src/index.tsx" },
        devServer: {
            contentBase: "./docs",
        },
        devtool: "source-map",
        output: {
            path: path.resolve(__dirname, "docs"),
            filename: "./[name].js",
            publicPath: "/",
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
        module: {
            rules: [
                { test: /\.jsx$/, loader: "surplus-loader" },
                { test: /\.ts$/, loader: "ts-loader" },
                { test: /\.tsx$/, loader: "surplus-loader!ts-loader" },
            ],
        },
        plugins,
        /* currently needed for workaround for uglify-es bug involving incorrect inlining */
        optimization: {
            minimizer: [
                new UglifyJsPlugin({
                    sourceMap: true,
                    uglifyOptions: {
                        compress: {
                            inline: 1, // default is 3, which causes errors
                        },
                    },
                }),
            ],
        },
    };
};

