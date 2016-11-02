import * as process from 'process';
import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';

import { BrowserWindow, app, dialog, ipcMain } from 'electron';

import Env from './core/common/environment';
import Window from './editor/main/window';

import Directory from './core/common/io/directory';

var Pubsub = require('backbone').Events;

/**
 * Handler for closing the application.
 * @returns {boolean} Whether quitting the application was successful or not.
 */
function quit() {
    Pubsub.trigger('main:quit');
    app.quit();
    return true;
}

app.commandLine.appendSwitch('disable-http-cache');

app.on('ready', function() {
    // Create a loading window, so the user knows, that the main window is going
    // to be opened in a few seconds
    let loading = new BrowserWindow({
        width: 400,
        height: 200,
        show: false,
        transparent: true,
        closable: false,
        alwaysOnTop: true,
        frame: false
    });
    loading.webContents.on('did-finish-load', () => loading.show());
    loading.loadURL('file:///' + path.resolve(Env.templateDir, 'editor/loading.html'));

    let window = new Window('app/editor', { show: false, load: true });

    window.browserWindow.webContents.once('did-finish-load', () => {
        let delay = 250
        // Send the loader a message, that the main window is loaded, so the
        // loader can animate some stuff, etc.
        loading.webContents.send('loaded', delay);
        setTimeout(() => {
            loading.setClosable(true);
            window.browserWindow.show();
            window.browserWindow.maximize();
            if (loading.isClosable())
                loading.close();
        }, delay);
    });

    ipcMain.on('showOpenDialog', (event, options, id) => {
        if (id)
            event.sender.send(`showOpenDialog:${id}`, dialog.showOpenDialog(options));
        else
            event.sender.send('showOpenDialog', dialog.showOpenDialog(options));
    });

    ipcMain.on('showSaveDialog', (event, options, id) => {
        if (id)
            event.sender.send(`showSaveDialog:${id}`, dialog.showSaveDialog(options));
        else
            event.sender.send('showSaveDialog', dialog.showSaveDialog(options));
    });

    ipcMain.on('scanDirectory', (event, dirpath: string, id: string) => {
        let dir = new Directory(dirpath);
        dir.on('scan:file', file => event.sender.send(`scanDirectory:${id}:file`, file) );
        dir.on('scan:dir', dir => event.sender.send(`scanDirectory:${id}:dir`, dir.path) );
        dir.on('scan:dir:done', dir => event.sender.send(`scanDirectory:${id}:dir:done`, dir.toJSON()) );
        dir.on('scan:done', () => event.sender.send(`scanDirectory:${id}:done`, dir.toJSON()) );
        dir.on('scan:fail', e => event.sender.send(`scanDirectory:${id}:fail`, e) );
        dir.scan();
    });

    ipcMain.on('newWindow', () => {
        let window = new Window('app/editor', { load: true } );
    });
});

app.on('window-all-closed', () => app.quit());
