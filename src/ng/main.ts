import { Pubsub } from '.';
import { extend } from 'common/require';

const mapping = {};

// Define a way to require yame
extend(mapping);

// import './style.scss';
// import './polyfills';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { enableProdMode } from '@angular/core';
import { environment } from '../environments';
import { PluginManager } from './modules/plugin/plugin.manager';

if (environment.production) enableProdMode();

/**
 * Initializes the angular app.
 */
function initNg(): Promise<any> {
  return import('./app.module').then(module => {
    return platformBrowserDynamic()
      .bootstrapModule(module.AppModule)
      .then(componentRef => Pubsub.emit('ready', componentRef));
  });
}

const pluginManager = new PluginManager();
pluginManager.initialize().then(initNg).catch(initNg);
