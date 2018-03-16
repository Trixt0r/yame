import * as _ from 'lodash';
import { Plugin } from './interface/plugin';
import PubSub from './pubsub';
import * as Promise from 'bluebird';
import { YameEnvironment } from './interface/environment';

/**
 * The plugin manager handles the installation, activation and initialization of yame plugins.
 * In order to get initialized, the plugin has to serve a package.json file with a `yame` attribute.
 * Inside this attributes the entry point for each part of the app should be defined.
 * For example:
 * ```json
 * {
 * ...
 * "yame": {
 *   "electron": "path-to/electron/entry-point",
 *   "ng": "path-to/angular/entry-point"
 * }
 * ...
 * }
 * ```
 *
 * @class PluginManager
 */
export abstract class CommonPluginManager {

  /**
   * Determines, which type of code this manager will load.
   * Either `electron` or `ng`.
   *
   * @protected
   * @abstract
   * @type {string}
   */
  protected abstract type: string;

  /**
   * Defines the yame environment of the manager.
   *
   * @protected
   * @abstract
   * @type {YameEnvironment}
   */
  protected abstract environment: YameEnvironment;

  /**
   * Attempts to initialize the given plugin files.
   *
   * @protected
   * @param {string[]} files Files inside the plugin directories.
   * @returns {Promise<any>}
   */
  protected initializeFromFiles(files: string[]): Promise<any> {
    let promises = [];
    files.forEach(file => {
      try {
        const config = this.require(`${file}`);
        const yameConfig = config.yame;
        if (!yameConfig)
          throw new Error(`No yame config found in ${file}`);
        const entryPoint = yameConfig[this.type];
        if (typeof entryPoint !== 'string' || entryPoint === '')
          throw new Error(`No ${file} entry point configured in ${file}`);
        const filePath = `${file.replace('package.json', '')}${entryPoint}`;
        const plugin: Plugin = this.require(filePath);
        if (!plugin || typeof plugin.initialize !== 'function')
          return console.warn('Could not initialize plugin in', filePath);
        promises.push(
          plugin.initialize()
            .then(() => {
              plugin.isInitialized = true;
              this.environment.plugins.push(plugin);
            })
            .catch(e => {
               plugin.isInitialized = false;
              console.warn('Error occurred while loading plugin ', filePath, e.message);
            })
        );
      } catch (e) {
        // TODO: logs this in a persistant place
        console.error('require error', e);
      }
    });
    return Promise.all(promises);
  }

  /**
   * Initializes all plugins.
   *
   * @returns {Promise<any>} Resolves on success.
   */
  initialize(): Promise<any> {
    return this.getFiles()
            .then(files => this.initializeFromFiles(files));
  }

  /**
   * Reads all plugin files from the config and resolves them.
   *
   * @returns {Promise<string[]>}
   */
  abstract getFiles(): Promise<string []>;

  abstract require(path: string): any;

}
