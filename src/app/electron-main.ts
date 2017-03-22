import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';

let readFile = Promise.promisify(fs.readFile);

import {
  BrowserWindow,
  app,
  dialog,
  ipcMain
} from 'electron';

/**
 * Handler for closing the application.
 * @returns {boolean} Whether quitting the application was successful or not.
 */
function quit() {
  app.quit();
  return true;
}

app.commandLine.appendSwitch('disable-http-cache');

app.on('ready', function() {
  let window = new BrowserWindow({
    backgroundColor: '#272B30',
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
  });
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);
  let appDir = path.resolve(__dirname, '..', '..');

  window.loadURL(`file:///${path.resolve(appDir, 'index.html')}`);

  readFile(path.resolve(appDir, 'config.json'))//
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

app.on('window-all-closed', () => app.quit());