/**
 * System configuration for Angular samples
 * Adjust as necessary for your application needs.
 */
(function (global) {
  System.config({
    baseURL: 'dist',
    paths: {
      // paths serve as alias
      'npm:': './node_modules/',
    },
    // map tells the System loader where to look for things
    map: {
      // our app is within the app folder
      app: 'app',

      // angular bundles
      '@angular/core': 'npm:@angular/core/bundles/core.umd.js',
      '@angular/common': 'npm:@angular/common/bundles/common.umd.js',
      '@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
      '@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
      '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
      '@angular/http': 'npm:@angular/http/bundles/http.umd.js',
      '@angular/router': 'npm:@angular/router/bundles/router.umd.js',
      '@angular/forms': 'npm:@angular/forms/bundles/forms.umd.js',
      '@angular/animations': 'npm:@angular/animations/bundles/animations.umd.js',
      '@angular/animations/browser': 'npm:@angular/animations/bundles/animations-browser.umd.js',
      '@angular/platform-browser/animations': 'npm:@angular/platform-browser/bundles/platform-browser-animations.umd.js',
      '@angular/material': 'npm:@angular/material/bundles/material.umd.js',
      '@angular/cdk': 'npm:@angular/cdk/bundles/cdk.umd.js',

      'electron': '@node/electron',
      'fs': '@node/fs',
      'path': '@node/path',
      'os': '@node/os',
      'lodash': '@node/lodash',
      'bluebird': '@node/bluebird',

      // other libraries
      'jquery':                    'npm:jquery/dist/jquery.js',
      'pixi.js':                   'npm:pixi.js/dist/pixi.js',
      'keyboardjs':                'npm:keyboardjs/dist/keyboard.js',
      'eventemitter3':             'npm:eventemitter3/umd/eventemitter3.min.js',
      'rxjs':                      'npm:rxjs',
      'angular-tree-component':    'npm:angular-tree-component/dist/angular-tree-component.umd.js',
      '@ng-bootstrap/ng-bootstrap': 'npm:@ng-bootstrap/ng-bootstrap/bundles/ng-bootstrap.js',
      'angular-in-memory-web-api': 'npm:angular-in-memory-web-api/bundles/in-memory-web-api.umd.js',
    },
    // packages tells the System loader how to load when no filename and/or no extension
    packages: {
      app: {
        defaultExtension: 'js'
      },
      rxjs: {
        defaultExtension: 'js'
      },
      jquery: {
        defaultExtension: 'js'
      },
      jquery: {
        defaultExtension: 'js'
      }
    }
  });
})(this);
