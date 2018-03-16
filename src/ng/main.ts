import * as yame from './idx';
import { extend } from 'common/require';
// Define a way to require yame
extend(yame);

import { ipcRenderer } from 'electron'; // satisfy the tsc when compiling with webpack
import * as _ from 'lodash';
import * as path from 'path';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { enableProdMode } from '@angular/core';
import { environment } from '../environments';
import { Plugin } from 'common/interface/plugin';
import { Environment } from './environment';
import { PluginManager } from './module/plugin/manager';

if (environment.production)
  enableProdMode();

function initNg() {
  platformBrowserDynamic()
    .bootstrapModule(require('./module/app').AppModule)
    .then(componentRef => yame.Pubsub.emit('ready', componentRef));
}

const pluginManager = new PluginManager();
pluginManager.initialize()
  .then(initNg)
  .catch(initNg);
