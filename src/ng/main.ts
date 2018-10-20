import * as yame from './idx';
import { extend } from 'common/require';
// Define a way to require yame
extend(yame);

import './style.scss';
import './polyfills';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { enableProdMode } from '@angular/core';
import { environment } from '../environments';
import { PluginManager } from './module/plugin/manager';

if (environment.production)
  enableProdMode();

/**
 * Initializes the angular app.
 *
 * @returns {Promise<any>}
 */
function initNg(): Promise<any> {
  return import('./module/app')
    .then(module => {
      return platformBrowserDynamic()
        .bootstrapModule(module.AppModule)
        .then(componentRef => yame.Pubsub.emit('ready', componentRef))
    });
}

const pluginManager = new PluginManager();
pluginManager.initialize()
  .then(initNg)
  .catch(initNg);
