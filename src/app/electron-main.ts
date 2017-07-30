import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindow, app } from 'electron';
import { File } from './common/io/file';
import initIpc from './browser/ipc';

let readFile = Promise.promisify(fs.readFile);

/**
 * Handler for closing the application.
 * @returns {boolean} Whether quitting the application was successful or not.
 */
function quit() {
  app.quit();
  return true;
}

app.commandLine.appendSwitch('disable-http-cache');

app.on('ready', () => {
  initIpc()
    .finally(() => {
      let window = new BrowserWindow({
        backgroundColor: '#303030',
        width: 1280,
        height: 720,
        minWidth: 800,
        minHeight: 600,
      });
      window.setAutoHideMenuBar(true);
      window.setMenuBarVisibility(false);
      let appDir = path.resolve(__dirname, '..', '..');

      window.loadURL(`file:///${path.resolve(appDir, 'index.html')}`);

      let file = new File(path.resolve(appDir, 'config.json'));
      file.read()
        .then((data) => {
          try {
            let json = JSON.parse(data.toString());
            if (json.devMode === true) {
              const client = require('electron-connect').client;
              client.create(window);
            }
          } catch (e) {
            console.error('Could not parse config file');
          }
        });
      });
});

app.on('window-all-closed', () => app.quit());