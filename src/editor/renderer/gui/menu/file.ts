import * as fs from 'fs';
import * as path from 'path';

import * as Promise from 'bluebird';
import {ipcRenderer} from 'electron';
import {remote} from 'electron';

import { Button, Group as ButtonGroup } from '../../../../core/renderer/view/button';
import View from '../../../../core/renderer/view/abstract';

import EDITOR from '../../globals';
import * as Selection from '../../interaction/selection';

export class File extends View {

    constructor(options: any = { }) {
        super(options);

        let currentFile;

        let fileButtons = new ButtonGroup( {
            id: 'menu-file-file-buttons',
            activateButtons: false
        });
        fileButtons.synchButtons();

        let saveButtons = new ButtonGroup( {
            id: 'menu-file-save-buttons',
            activateButtons: false
        });
        saveButtons.synchButtons();

        let openButtons = new ButtonGroup( {
            id: 'menu-file-open-buttons',
            activateButtons: false
        });

        let quitButton = new Button({
            id: 'menu-file-quit-buttons'
        });

        openButtons.synchButtons();

        quitButton.on('click', () => remote.getCurrentWindow().close() );

        fileButtons.on('click', (button: Button) => {
            button.$el.blur();
            let action = button.$el.attr('data-action');
            switch(action) {
                case 'new-map': ipcRenderer.send('newWindow'); break;
            }
        });

        saveButtons.on('click', (button: Button) => {
            button.$el.blur();
            let action = button.$el.attr('data-action');
            switch(action) {
                case 'save': this.save(currentFile).then(f => currentFile = f); break;
                case 'save-as': this.save().then(f => currentFile = f); break;
            }
        });

        openButtons.on('click', (button: Button) => {
            button.$el.blur();
            let action = button.$el.attr('data-action');
            switch(action) {
                case 'open-folder': this.open().then(f => currentFile = f); break;
            }
        });
    }

    /**
     * Saves the current map to the given file path.
     * @param {string} [fileName] Optional file name. If omitted a save dialog
     * is shown.
     * @returns {Promise<string>} Resolves the save file path if the map has
     * been sucessfully saved.
     */
    save(fileName?: string): Promise<string> {
        let options = {
            title: 'Save map',
            filters: [ {name: 'YAME files', extensions: ['yame']} ]
        };
        return new Promise<string>((resolve, reject) => {
            if (!fileName) {
                ipcRenderer.send('showSaveDialog', options, 'menuSave');
                ipcRenderer.once('showSaveDialog:menuSave', (event, file: string) => {
                    if (file) resolve(file);
                    else reject();
                });
            } else resolve(fileName);
        })
        .then(fileName => {
            fileName = fileName.replace('.yame', '') + '.yame';
            let write = <any>Promise.promisify(fs.writeFile);
            let prev = Selection.get();
            Selection.clear(true);
            let json = EDITOR.map.toJSON({ parentPath: path.dirname(fileName) });
            Selection.select(prev, true);
            return write(fileName, JSON.stringify(json, null, 2) )
                .then(() => document.title = 'YAME - ' + path.basename(fileName, '.yame') )
                .then(() => fileName);
        });
    }

    /**
     * Opens a file.
     *
     * @returns {Promise<string>}
     */
    open(): Promise<string> {
        let options = {
            title: 'Open map',
            filters: [ {name: 'YAME files', extensions: ['yame']} ],
            properties: ['openFile']
        };
        Selection.clear();
        return new Promise<string>( (resolve, reject) => {
            ipcRenderer.send('showOpenDialog', options, 'menuOpen');
            ipcRenderer.once('showOpenDialog:menuOpen', (event, files: string[]) => {
                if (files) resolve(files[0]);
                else reject();
            });
        })
        .then(file => {
            let read = Promise.promisify(fs.readFile);
            return read(file).then(str => {
                try {
                    let json = JSON.parse(str.toString());
                    EDITOR.map.parse(json, {parentPath: path.dirname(file) });
                } catch(e) {
                    return Promise.reject(e);
                }
                return file;
            });
        });
    }
}

export default File;