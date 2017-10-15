import {ipcRenderer} from 'electron'; // satisfy the tsc when compiling with webpack

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { enableProdMode } from '@angular/core';
import { environment } from '../environments';
import { AppModule } from './module/app';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
