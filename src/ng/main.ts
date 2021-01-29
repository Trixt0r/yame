// TODO: check if
// import * as angularAnimation from '@angular/animations';
// import * as angularCdk from '@angular/cdk';
// import * as angularCommon from '@angular/common';
// import * as angularCore from '@angular/core';
// import * as angularForm from '@angular/forms';
// import * as angularPlatformBrowser from '@angular/platform-browser';
// import * as angularPlatformBrowserDynamic from '@angular/platform-browser-dynamic';
// import * as angularRouter from '@angular/router';
// import * as angularPipes from 'angular-pipes';
// import * as bluebird from 'bluebird';
// import * as eventemitter3 from 'eventemitter3';
// import * as lodash from 'lodash';
// import * as uuid from 'uuid';
// import * as yame from '.';
import { Pubsub } from '.';
import { extend } from 'common/require';

const mapping = {
  // yame: yame,
  // '@angular/animations': angularAnimation,
  // '@angular/cdk': angularCdk,
  // '@angular/common': angularCommon,
  // '@angular/core': angularCore,
  // '@angular/forms': angularForm,
  // '@angular/platform-browser': angularPlatformBrowser,
  // '@angular/platform-browser-dynamic': angularPlatformBrowserDynamic,
  // '@angular/router': angularRouter,
  // 'angular-pipes': angularPipes,
  // bluebird: bluebird,
  // eventemitter3: eventemitter3,
  // lodash: lodash,
  // uuid: uuid,
};

// Define a way to require yame
extend(mapping);

import './style.scss';
import './polyfills';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { enableProdMode } from '@angular/core';
import { environment } from '../environments';
import { PluginManager } from './modules/plugin/plugin.manager';

if (environment.production)
  enableProdMode();

/**
 * Initializes the angular app.
 *
 * @returns {Promise<any>}
 */
function initNg(): Promise<any> {
  return import('./app.module')
    .then(module => {
      return platformBrowserDynamic()
        .bootstrapModule(module.AppModule)
        .then(componentRef => Pubsub.emit('ready', componentRef))
    });
}

const pluginManager = new PluginManager();
pluginManager.initialize()
  .then(initNg)
  .catch(initNg);
