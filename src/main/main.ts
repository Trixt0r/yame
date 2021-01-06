import * as yame from '.';
import * as bluebird from 'bluebird';
import * as eventemitter3 from 'eventemitter3';
import * as fsExtra from 'fs-extra';
import * as lodash from 'lodash';
import * as uuid from 'uuid';
import { extend } from '../common/require';
const mapping = {
  yame: yame,
  bluebird: bluebird,
  eventemitter3: eventemitter3,
  'fs-extra': fsExtra,
  lodash: lodash,
  uuid: uuid,
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
  pluginManager.finalize()
    .then(() => app.quit());
}

/**
 * Initializes the app window and triggers the public subscribtion event 'ready'.
 *
 * @returns {void}
 */
function init() {
  const window = new BrowserWindow({
    backgroundColor: '#303030',
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
    }
  });
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);

  Environment.window = window;

  window.loadURL(`file:///${path.resolve(Environment.ngDir, 'index.html')}`);
  yame.Pubsub.emit('ready', window);
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
      Environment.config = { };
      console.error('Could not parse config file');
    }
  } catch (e) {
    console.warn(e);
  }
  await initIpc();
  init();
});

app.on('window-all-closed', quit);
