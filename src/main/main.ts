import * as yame from '.';
import * as eventemitter3 from 'eventemitter3';
import * as fsExtra from 'fs-extra';
import * as lodash from 'lodash';
import * as uuid from 'uuid';
import { extend } from '../common/require';

const mapping = {
  yame,
  eventemitter3,
  'fs-extra': fsExtra,
  lodash,
  uuid,
};
extend(mapping);

import * as path from 'path';
import { BrowserWindow, app } from 'electron';
import { File } from './io/file';
import initIpc from './ipc';
import { Environment } from './environment';
import { PluginManager } from './plugin/manager';

// app.commandLine.appendSwitch('ignore-connections-limit', '/'); doesn't seem to work for files

Environment.app = app;

Environment.appDir = path.resolve(__dirname, '..');
Environment.ngDir = path.resolve(Environment.appDir, 'ng');
Environment.electronDir = path.resolve(Environment.appDir, 'electron');
Environment.commonDir = path.resolve(Environment.appDir, 'common');

const pluginManager = new PluginManager();

app.commandLine.appendSwitch('disable-http-cache');

/**
 * Handler for closing the application.
 * @returns {boolean} Whether quitting the application was successful or not.
 */
function quit() {
  pluginManager.finalize().then(() => app.quit());
}

/**
 * Initializes the app window and triggers the public subscription event 'ready'.
 */
function init(): void {
  const window = new BrowserWindow({
    backgroundColor: '#303030',
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    // frame: false,
    // titleBarStyle: 'hidden',
    thickFrame: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
    },
  });
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);

  Environment.window = window;

  window.loadURL(`file:///${path.resolve(Environment.ngDir, 'index.html')}`);
  yame.Pubsub.emit('ready', window);
  window.on('close', () => window.destroy());
}

app.on('ready', async () => {
  try {
    const file = new File(path.resolve(__dirname, '..', 'config.json'));
    const data = await file.read();
    try {
      const json = JSON.parse(data.toString());
      Environment.config = json;
      await pluginManager.initialize();
    } catch (e) {
      Environment.config = {};
      console.error('Could not parse config file');
    }
  } catch (e) {
    console.warn(e);
  }
  await initIpc();
  init();
});

app.on('window-all-closed', quit);
