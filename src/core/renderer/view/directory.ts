import * as Utils from '../drop/utils';

import {ipcRenderer} from 'electron';

import * as _ from 'underscore';
import * as path from 'path';
import * as fs from 'fs';

import Tree from './tree';
import Payload from '../drop/payload';

class State {
    opened: boolean;
    selected: boolean;
}

class File {
    icon: string;
    id: string;
    text: string;
    state: State;
    type: string = 'file';
}

class Folder extends File {
    icon: string;
    children: File[] = [];
    type: string = 'folder';
}

/**
 * View which is able to display the structure of a directory.
 * @export
 * @class Directory
 * @extends {Tree}
 */
export class Directory extends Tree {

    public fileIcons: { [key: string]: string };

    constructor(options: any = {}) {
        super(_.extend({
            jstree: {
                types: {
                    "#": {
                        valid_children: ["folder", "file"],
                    },
                    folder: {
                        valid_children: ["folder", "file"],
                        icon: "icon folder outline medium large"
                    },
                    file: {
                        icon: "icon file outline medium large",
                        valid_children: [],
                    }
                },
            }
        }, options));

        this.$el.on("select_node.jstree", (e, data) => {
            data.instance.toggle_node(data.node);
            let payload = this.payloadFromFile(data.node.id);
            if (payload)
                this.trigger('select:file', payload);
            else
                this.trigger('select:dir', data.node.id);
        } );

        $(document).on('dnd_start.vakata', (e: any, data) => {
            // Only react on d&d from this tree
            if (!$.contains( this.el, e.delegateTarget.activeElement) ) return;
            let file = data.data;
            let ev = data.event.originalEvent;
            let payload = this.payloadFromFile(file.nodes[0]);
            // Write the payload into the event, so any other element can react
            if (payload)
                Utils.setPayload(ev, payload.type, payload.content);
        });

        // TODO: check if this is needed anywhere
        // $(document).on('click', e => {
        //     if (!$(e.target).hasClass('jstree-anchor') && $.contains(e.target, this.el) )
        //         this.$el.jstree(true).deselect_all();
        // });

        this.fileIcons = {
            png: 'file image outline medium large icon',
            jpg: 'file image outline medium large icon',
            jpeg: 'file image outline medium large icon',
            gif: 'file image outline medium large icon',
            json: 'code large icon'
        };
    }

    private payloadFromFile(filepath): Payload {
        // Skip if something other than a file gets dragged
        if (!fs.lstatSync(filepath).isFile())
            return null;
        let type = 'file:' + path.extname(filepath).replace('.', '');
        return {
            type: type,
            content: filepath
        };
    }

    private fileToJstree(json: any): any {
        let obj: any = {
            id: json.path,
            text: json.name,
            type: 'file'
        };
        var ext = path.extname(json.name).replace('.', '');
        let found = _.find(this.fileIcons, (icon, type) => ext == type );
        if (found)
            obj.icon = found;
        return obj;
    }

    /**
     * @private Creates a jstree compatible data structure from the given JSON.
     * @param {*} dir
     * @returns {*}
     */
    private readDir(dir: any): any {
        let root = {
            id: dir.path,
            text: dir.name,
            type: 'folder',
            children: []
        };
        dir.files.forEach(file => {
            let obj: any;
            if (file.files)
                obj = this.readDir(file);
            else
                obj = this.fileToJstree(file);
            root.children.push(obj);
        });
        return root;
    }

    /**
     * Loads the given directory path for all files and sub directories.
     * @param {string} dirpath
     * @chainable
     */
    load(dirpath: string) {
        let t = Date.now();
        let data = [];
        (<any>this.$el.jstree(true)).settings.core.data = data;
        let id = _.uniqueId('directoryView');
        ipcRenderer.send('scanDirectory', dirpath, id);
        let sort = (a, b) => {
            if (a.children && !b.children)
                return -1;
            else if(!a.children && b.children)
                return 1;
            else if (a.text.toLowerCase() <= b.text.toLowerCase())
                return -1;
            else
                return 1;
        };
        let dirListener =  (e, json) => {
            let res = this.readDir(json);
            data.push(res);
            data.sort(sort);
            (<any>this.$el.jstree(true)).refresh();
        }
        let fileListener = (e, json) => {
            data.push(this.fileToJstree(json));
            data.sort(sort);
            (<any>this.$el.jstree(true)).refresh();
        };
        ipcRenderer.on(`scanDirectory:${id}:dir:done`, dirListener);

        ipcRenderer.on(`scanDirectory:${id}:file`, fileListener);

        ipcRenderer.once(`scanDirectory:${id}:done`, (event, json)  => {
            ipcRenderer.removeListener(`scanDirectory:${id}:dir:done`, dirListener);
            ipcRenderer.removeListener(`scanDirectory:${id}:file`, fileListener);
            this.trigger('scan:done', json);
        });
        ipcRenderer.once(`scanDirectory:${id}:fail`, (event, err)  => {
            ipcRenderer.removeListener(`scanDirectory:${id}:dir:done`, dirListener);
            ipcRenderer.removeListener(`scanDirectory:${id}:file`, fileListener);
            this.trigger('scan:fail', err);
        });
        return this;
    }
}

export default Directory;