// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

const nodeExternals = require('webpack-node-externals');

module.exports = function (config) {
  config.set({
    basePath: './',
    frameworks: ['jasmine', '@angular/cli'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('karma-electron'),
      require('@angular/cli/plugins/karma')
    ],
    client:{
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      useIframe: false
    },
    files: [
      { pattern: './src/ng/test.ts', watched: false },
      { pattern: './assets/**', watched: false, included: false, nocache: false, served: true }
    ],
    proxies: {
      '/assets/': '/_karma_webpack_/assets/'
    },
    preprocessors: {
      './src/ng/test.ts': ['@angular/cli', 'electron']
    },
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    coverageIstanbulReporter: {
      reports: [ 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true
    },
    angularCli: {
      environment: 'dev'
    },
    webpack: {
      target: 'electron-renderer'
    },
    reporters: config.angularCli && config.angularCli.codeCoverage
              ? ['progress', 'coverage-istanbul']
              : ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ElectronDebugging'],
    customLaunchers: {
      ElectronDebugging: {
        base: 'Electron',
        flags: ['--show']
      },
    },
    singleRun: false
  });
};
