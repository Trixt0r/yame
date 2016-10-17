import * as fs from 'fs';
import * as path from 'path';

import * as Promise from 'bluebird';
import * as _ from 'underscore';


import Env from '../core/common/environment';

/**
 * The plugin manager is responsible for loading all editor plugins and
 * initialize them. This can be done in both electron processes.
 * @singleton
 * @class PluginManager
 */
abstract class PluginManager {

    private static _plugins: { [key: string]: any; } = { };

    /**
     * @readonly
     * @static
     * @type {*} Copy of all currently loaded plugins.
     */
    static get plugins(): any {
        return _.extend({ } , this._plugins);
    };

    /**
     * @static
     * @param {string} name The module name (with it's prefix).
     * @returns {boolean} Whether the given module exists or not.
     */
    static has(name: string): boolean {
        return this._plugins[name] != void 0;
    }

    /**
     * Scans the node modules folder for yame plugins and requires them.
     * A node module is recognized as a yame plugin if the prefix of the module
     * name matches one of the given prefixes. Default prefix is `yame-`
     * @static
     * @param {string[]} [pluginPrefixes=['yame-']]
     * @returns {Promise<any>}
     */
    public static load(pluginPrefixes: string[] = ['yame-']): Promise<any> {
        // Allow each prefix only once
        let prefixes = _.unique(pluginPrefixes);
        return new Promise((resolve, reject) => {
            fs.readdir(Env.nodeDir, (err, files) => {
                if (err) return reject(err);
                files.forEach(file => {
                    // Check if the file is a valid yame plugin
                    let found = _.find(prefixes, p => file.indexOf(p) === 0);
                    // If yes, check if the file is a directory and require it
                    if (found) {
                        let fullPath = path.resolve(Env.nodeDir, file);
                        try {
                            this._plugins[file] = require(fullPath) || true;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });
                resolve();
            });
        } );
    }

    /**
     * Executes all plugins which return a function.
     * The functions are called with the given context and arguments.
     * @static
     * @param {*} context
     * @param {any} args Arguments to be passed to the plugin function.
     * @returns {Promise<any>}
     */
    public static run(context: any, ...args): Promise<any> {
        let fns = [];
        _.each(this._plugins, plugin => {
            if (typeof plugin == 'function')
                fns.push(plugin.apply(context, args));
        });
        return Promise.all(fns);
    }
}

export default PluginManager;