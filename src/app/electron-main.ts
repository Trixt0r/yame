// import * as process from 'process';
// import * as fs from 'fs';
import * as path from 'path';
// import * as Promise from 'bluebird';
import {
  BrowserWindow,
  app,
  dialog,
  ipcMain
} from 'electron';

const client = require('electron-connect').client;

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
    // Disable node integration since we use system js on the renderer
    webPreferences: {
      nodeIntegration: false
    }
  });
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);
  window.loadURL(`file:///${path.resolve('index.html')}`);
  client.create(window);
});

app.on('window-all-closed', () => app.quit());