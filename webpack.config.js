const AngularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
const nodeExternals = require('webpack-node-externals');

const baseDir = path.resolve(__dirname, 'src', 'ng');

module.exports = (env, argv) => {

  const isDevelopmentMode = (argv.mode === 'development');

  const devtool = isDevelopmentMode ? 'eval-source-map' : 'nosources-source-map';
  const outputDir = isDevelopmentMode ? 'out' : 'dist';
  const moduleIdentifierPlugin = isDevelopmentMode ? new webpack.NamedModulesPlugin() :
                                                      new webpack.HashedModuleIdsPlugin({
                                                        hashFunction: "md5",
                                                        hashDigest: "base64",
                                                        hashDigestLength: 4
                                                      });
  const abs = path.resolve('./', 'src');
  const workers = glob.sync(abs + '/**/*.worker.ts' );
  const workerEntries = { };
  workers.forEach(filePath => {
    const relative = path.basename(path.relative(abs, filePath), '.ts');
    workerEntries[relative] = [filePath];
  });

  const externals = isDevelopmentMode ? [nodeExternals()] : [];

  return [{
    target: 'electron-renderer',
    entry: {
      polyfill: './src/ng/polyfills.ts',
      main: './src/ng/main.ts'
    },
    output: {
      filename: '[name].[contenthash].js',
      path: path.join(__dirname, outputDir, 'ng')
    },
    devtool: devtool,
    resolve: {
      extensions: [ '.ts', '.js' ]
    },
    externals: externals,
    module: {
      rules: [
        {
          test: /(\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
          loader: '@ngtools/webpack'
        },
        {
          test: /\.(html|css)$/,
          loader: 'raw-loader'
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
          exclude: [ path.join(baseDir, 'style.scss') ],
          test: /\.scss$|\.sass$/,
          loaders: [ 'raw-loader', 'sass-loader' ]
        },
        {
          include: [ path.join(baseDir, 'style.scss'), path.join(baseDir, 'loading.scss') ],
          test: /\.scss$|\.sass$/,
          use: [ 'style-loader', 'css-loader', 'sass-loader' ],
        },
      ]
    },
    plugins: [
      new CleanWebpackPlugin([
        path.join( __dirname, outputDir, 'ng', '*'),
      ]),

      // Assets
      new CopyWebpackPlugin([
        'src/ng/favicon.ico',
        { from: 'src/ng/assets', to: 'assets', ignore: '.gitkeep' }
      ]),

      // Angular
      new AngularCompilerPlugin({
        tsConfigPath: path.join(baseDir, 'tsconfig.app.json'),
        mainPath: 'main.ts',
        hostReplacementPaths: {
          'environments/index.ts': isDevelopmentMode ? 'environments/index.ts' : 'environments/index.prod.ts'
        },
        skipCodeGeneration: true,
        sourceMap: true
      }),

      // HTML
      new HtmlWebpackPlugin({
        filename: './index.html',
        template: path.resolve(baseDir, 'index.html')
      }),

      moduleIdentifierPlugin
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true
          }
        }
      },
      runtimeChunk: 'single'
    },
    node: {
      fs: 'empty',
      global: true,
      crypto: 'empty',
      tls: 'empty',
      net: 'empty',
      process: true,
      module: false,
      clearImmediate: false,
      setImmediate: false,
      __dirname: false,
      __filename: false
    }
  }, {
    entry: workerEntries,
    output: {
      path: path.join(__dirname, outputDir, 'ng', 'workers'),
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'awesome-typescript-loader',
          options: {
            configFileName: path.join(baseDir, 'tsconfig.app.json')
          }
        }
      ]
    }
  }];
};
