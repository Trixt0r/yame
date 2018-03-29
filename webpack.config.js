const path = require('path');
const glob = require('glob');
const _ = require('lodash');
const webpack = require('webpack');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer');
const postcssUrl = require('postcss-url');
const nodeExternals = require('webpack-node-externals');

const { NoEmitOnErrorsPlugin, LoaderOptionsPlugin, DefinePlugin, HashedModuleIdsPlugin } = require('webpack');
const { GlobCopyWebpackPlugin, BaseHrefWebpackPlugin } = require('@angular/cli/plugins/webpack');
const { CommonsChunkPlugin, UglifyJsPlugin } = require('webpack').optimize;
const { AngularCompilerPlugin } = require('@ngtools/webpack');

const nodeModules = path.join(process.cwd(), 'node_modules');
const entryPoints = ["inline", "polyfills", "vendor", "common", "main"];
const baseHref = "";
const deployUrl = "";

const isProd = (process.env.NODE_ENV === 'production');

const abs = path.resolve('./', 'src');
const workers = glob.sync(abs + '/**/*.worker.ts' );
const workerEntries = { };
workers.forEach(filePath => {
  const relative = path.basename(path.relative(abs, filePath), '.ts');
  workerEntries[relative] = [filePath];
});

function getPlugins() {
  var plugins = [];

  // Always expose NODE_ENV to webpack, you can now use `process.env.NODE_ENV`
  // inside your code for any environment checks; UglifyJS will automatically
  // drop any unreachable code.
  plugins.push(new DefinePlugin({
    "process.env.NODE_ENV": "\"production\""
  }));

  plugins.push(new NoEmitOnErrorsPlugin());

  plugins.push(new GlobCopyWebpackPlugin({
    patterns: [
      "./assets/**",
      "./favicon.ico"
    ],
    globOptions: {
      cwd: process.cwd() + "/src/ng",
      dot: true,
      ignore: "**/.gitkeep"
    }
  }));

  plugins.push(new ProgressPlugin());

  plugins.push(new HtmlWebpackPlugin({
    template: "./src/ng/index.html",
    filename: "./index.html",
    hash: false,
    inject: true,
    compile: true,
    favicon: false,
    minify: false,
    cache: true,
    showErrors: true,
    chunks: "all",
    excludeChunks: Object.keys(workerEntries),
    title: "Webpack App",
    xhtml: true,
    chunksSortMode: function sort(left, right) {
      let leftIndex = entryPoints.indexOf(left.names[0]);
      let rightindex = entryPoints.indexOf(right.names[0]);
      if (leftIndex > rightindex) {
        return 1;
      }
      else if (leftIndex < rightindex) {
        return -1;
      }
      else {
        return 0;
      }
    }
  }));

  plugins.push(new BaseHrefWebpackPlugin({}));

  plugins.push(new ExtractTextPlugin("style.css", { allChunks: true } ));

  plugins.push(new LoaderOptionsPlugin({
    sourceMap: false,
    options: {
      postcss: [
        autoprefixer(),
        postcssUrl({
          url: (obj) => {
            // Only convert root relative URLs, which CSS-Loader won't process into require().
            if (!obj.url.startsWith('/') || obj.url.startsWith('//')) {
              return obj.url;
            }
            if (deployUrl.match(/:\/\//)) {
              // If deployUrl contains a scheme, ignore baseHref use deployUrl as is.
              return `${deployUrl.replace(/\/$/, '')}${obj.url}`;
            }
            else if (baseHref.match(/:\/\//)) {
              // If baseHref contains a scheme, include it as is.
              return baseHref.replace(/\/$/, '') +
                `/${deployUrl}/${obj.url}`.replace(/\/\/+/g, '/');
            }
            else {
              // Join together base-href, deploy-url and the original URL.
              // Also dedupe multiple slashes into single ones.
              return `/${baseHref}/${deployUrl}/${obj.url}`.replace(/\/\/+/g, '/');
            }
          }
        })
      ],
      sassLoader: {
        sourceMap: false,
        includePaths: []
      },
      lessLoader: {
        sourceMap: false
      },
      context: ""
    }
  }));

  if (isProd) {
    plugins.push(new HashedModuleIdsPlugin({
      hashFunction: "md5",
      hashDigest: "base64",
      hashDigestLength: 4
    }));

    plugins.push(new AngularCompilerPlugin({
      mainPath: "main.ts",
      hostReplacementPaths: {
        "environments/index.ts": "environments/index.prod.ts"
      },
      exclude: [],
      tsConfigPath: "src/ng/tsconfig.app.json",
      skipCodeGeneration: true
    }));

    // causes errors
    /*plugins.push(new UglifyJsPlugin({
      mangle: {
        screw_ie8: true
      },
      compress: {
        screw_ie8: true,
        warnings: false
      },
      sourceMap: false
    }));*/

  } else {
    plugins.push(new AngularCompilerPlugin({
      mainPath: "main.ts",
      hostReplacementPaths: {
        "environments/index.ts": "environments/index.ts"
      },
      exclude: [],
      tsConfigPath: "src/ng/tsconfig.app.json",
      skipCodeGeneration: true
    }));
  }

  return plugins;
}

const baseConfig = {
  target: "electron-renderer",
  devtool: "source-map",
  externals: [nodeExternals()],
  resolve: {
    extensions: [
      ".ts",
      ".js",
      ".scss",
      ".json"
    ],
    aliasFields: [],
    alias: { // WORKAROUND See. angular-cli/issues/5433
      environments: path.resolve(__dirname, isProd ? 'src/environments/index.prod.ts' : 'src/environments/index.ts')
    },
    modules: [
      "./node_modules"
    ]
  },
  resolveLoader: {
    modules: [
      "./node_modules"
    ]
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.(js|ts)$/,
        loader: "source-map-loader",
        exclude: [
          /\/node_modules\//,
          path.join(process.cwd(), 'node_modules')
        ]
      },
      {
        test: /\.html$/,
        loader: "html-loader"
      },
      {
        test: /\.(eot|svg)$/,
        loader: "file-loader?name=[name].[hash:20].[ext]"
      },
      {
        test: /\.(jpg|png|gif|otf|ttf|woff|woff2|cur|ani)$/,
        loader: "url-loader?name=[name].[hash:20].[ext]&limit=10000"
      },
      {
        exclude: [
          path.join(process.cwd(), "src/ng/style.scss")
        ],
        test: /\.css$/,
        loaders: [
          "exports-loader?module.exports.toString()",
          "css-loader?{\"sourceMap\":false,\"importLoaders\":1}",
          "postcss-loader"
        ]
      },
      {
        exclude: [
          path.join(process.cwd(), "src/ng/style.scss")
        ],
        test: /\.scss$|\.sass$/,
        loaders: [
          "exports-loader?module.exports.toString()",
          "css-loader?{\"sourceMap\":false,\"importLoaders\":1}",
          "postcss-loader",
          "sass-loader"
        ]
      },
      {
        include: [
          path.join(process.cwd(), "src/ng/style.scss")
        ],
        test: /\.css$/,
        loaders: ExtractTextPlugin.extract({
          use: [
            "css-loader?{\"sourceMap\":false,\"importLoaders\":1}",
            "postcss-loader"
          ],
          fallback: "style-loader",
          publicPath: './'
        })
      },
      {
        include: [ path.join(process.cwd(), "src/ng/style.scss") ],
        test: /\.scss$|\.sass$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [ "css-loader", "sass-loader" ],
          publicPath: './'
        })
      },
      {
        test: /\.ts$/,
        loader: "@ngtools/webpack"
      }
    ]
  },
  plugins: getPlugins(),
  node: {
    fs: "empty",
    global: true,
    crypto: "empty",
    tls: "empty",
    net: "empty",
    process: true,
    module: false,
    clearImmediate: false,
    setImmediate: false,
    __dirname: false,
    __filename: false
  }
};

module.exports = [
  _.extend({
    entry: {
      main: [
        "./src/ng/main.ts"
      ],
      polyfills: [
        "./src/ng/polyfills.ts"
      ],
    },
    output: {
      path: path.join(process.cwd(), isProd ? "out" : "dist", "ng"),
      filename: "[name].bundle.js",
      chunkFilename: "[id].chunk.js"
    }
  }, baseConfig),
 _.extend({
    entry: workerEntries,
    output: {
      path: path.join(process.cwd(), isProd ? "out" : "dist", "ng", "workers"),
      filename: "[name].js"
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "awesome-typescript-loader",
          options: {
            configFileName: path.join(process.cwd(), "src/ng/tsconfig.app.json")
          }
        }
      ]
    }
  },_.omit(baseConfig, 'plugins', 'module'))
];
