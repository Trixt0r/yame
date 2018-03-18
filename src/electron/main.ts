import * as yame from './idx';
import { extend } from '../common/require';
// Define a way to require yame
extend(yame);

import * as path from 'path';
import * as fs from 'fs';
import * as electron from 'electron';
import { BrowserWindow, app } from 'electron';
import { File } from '../common/io/file';
import initIpc from './ipc';
import { Environment } from './environment';
import { PluginManager } from './plugin/manager';

Environment.app = app;

Environment.appDir = path.resolve(__dirname, '..');
Environment.ngDir = path.resolve(Environment.appDir, 'ng');
Environment.electronDir = path.resolve(Environment.appDir, 'electron');
Environment.commonDir = path.resolve(Environment.appDir, 'common');

const pluginManager = new PluginManager();

/**
 * Handler for closing the application.
 * @returns {boolean} Whether quitting the application was successful or not.
 */
function quit() {
  pluginManager.finalize()
    .then(() => app.quit());
}

app.commandLine.appendSwitch('disable-http-cache');

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
  });
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);

  Environment.window = window;

  window.loadURL(`file:///${path.resolve(Environment.ngDir, 'index.html')}`);
  yame.Pubsub.emit('ready', window);
  }

app.on('ready', () => {
  const file = new File(path.resolve(__dirname, '..', 'config.json'));
  file.read()
    .then(data => {
      try {
        const json = JSON.parse(data.toString());
        Environment.config = json;
        return pluginManager.initialize();
      } catch (e) {
        Environment.config = { };
        console.error('Could not parse config file');
      }
    })
    .catch(e => console.warn(e))
    .then(() => {
      initIpc(electron)
        .finally(init);
    });
});

app.on('window-all-closed', () => app.quit());
