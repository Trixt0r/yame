import * as path from 'path';
import * as fs from 'fs';
import * as electron from 'electron';
import { BrowserWindow, app } from 'electron';
import { File } from '../common/io/file';
import initIpc from './ipc';

const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

if (serve)
  require('electron-reload')(__dirname, { });

/**
 * Handler for closing the application.
 * @returns {boolean} Whether quitting the application was successful or not.
 */
function quit() {
  app.quit();
  return true;
}

app.commandLine.appendSwitch('disable-http-cache');

function init() {
  let window = new BrowserWindow({
    backgroundColor: '#303030',
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
  });
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);
  let appDir = path.resolve(__dirname, '..', 'ng');

  window.loadURL(`file:///${path.resolve(appDir, 'index.html')}`);

  let file = new File(path.resolve(__dirname, '..', '..', 'config.json'));
  file.read()
    .then((data) => {
      try {
        let json = JSON.parse(data.toString());
      } catch (e) {
        console.error('Could not parse config file');
      }
    })
    .catch(e => console.error(e));
  }

app.on('ready', () => {
  initIpc(electron)
    .finally(init);
});

app.on('window-all-closed', () => app.quit());
