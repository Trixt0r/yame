import * as _ from 'lodash';
import { YamePlugin, PluginConfig } from './plugin';
import * as Promise from 'bluebird';
import { YameEnvironment } from './interface/environment';
import { File } from './io/file';
import * as path from 'path';

interface PluginPaths {
  [key: string]: string;
}

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
   * Mapping for plugin id to the package.json of the plugin.
   *
   * @protected
   * @type {PluginPaths}
   */
  protected pluginPaths: PluginPaths = { };

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
        const config: PluginConfig = this.require(path.resolve(`${file}`, 'package.json'));
        config.yame = config.yame || <any>{ };
        const yameConfig = config.yame;
        if (typeof yameConfig.active !== 'boolean')
          yameConfig.active = true;
        const plugin: YamePlugin = this.require(file);
        if (!plugin || typeof plugin.initialize !== 'function')
          return console.warn('Could not initialize plugin in due to no initialize function', file);
        this.environment.plugins.push(plugin);
        plugin.config = config;
        plugin.isActive = plugin.config.yame.active;
        plugin.isInitialized = false;
        if (!plugin.id)
          plugin.id = (config.name || _.uniqueId('yame-plugin-'));
        this.pluginPaths[plugin.id] = file;
        plugin.environment = this.environment;
        plugin.config.file = file;
        if (!plugin.isActive)
          return console.info('Plugin', config.name, 'is deactivated');
        promises.push(
          plugin.initialize(this.type)
            .then(() => plugin.isInitialized = true)
            .catch(e => console.warn('Error occurred while loading plugin ', file, e.message))
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
   * Finalizes all plugins.
   *
   * @returns {Promise<any>}
   */
  finalize(): Promise<any> {
    const proms = this.environment.plugins.map(plugin => {
      return typeof plugin.finalize === 'function' ? plugin.finalize() : Promise.resolve();
    });
    return Promise.all(proms)
            .catch(e => console.error('Finalizing plugins failed', e));
  }

  /**
   * Persists the config for the given plugin.
   *
   * @protected
   * @todo Write to local user storage and not to the pacakge json.
   * @param {YamePlugin} plugin
   * @returns {Promise<any>}
   */
  protected persistConfig(plugin: YamePlugin): Promise<any> {
    const file = new File(path.resolve(this.pluginPaths[plugin.id], 'package.json'));
    return file.write(JSON.stringify(plugin.config, null, 2));
  }

  /**
   * Activates the plugin with the given id.
   *
   * @param {string} id
   * @returns {Promise<any>} Resolves on success.
   */
  activate(id: string): Promise<any> {
    const plugin = this.environment.plugins.find(plugin => plugin.id === id);
    if (!plugin) return Promise.resolve();
    if (plugin.isActive) return Promise.resolve();
    const done = () => {
      plugin.isActive = true;
      plugin.config.yame.active = true;
      return this.persistConfig(plugin);
    };
    return typeof plugin.activate === 'function' ? plugin.activate().then(done) : done();
  }

  /**
   * Deactivates the plugin with the given id.
   *
   * @param {string} id
   * @returns {Promise<any>} Resolves on success.
   */
  deactivate(id: string): Promise<any> {
    const plugin = this.environment.plugins.find(plugin => plugin.id === id);
    if (!plugin) return Promise.resolve();
    if (!plugin.isActive) return Promise.resolve();
    const done = () => {
      plugin.isActive = false;
      plugin.config.yame.active = false;
      return this.persistConfig(plugin);
    };
    return typeof plugin.deactivate === 'function' ? plugin.deactivate().then(done) : done();
  }

  /**
   * Reads all plugin files from the config and resolves them.
   *
   * @returns {Promise<string[]>}
   */
  abstract getFiles(): Promise<string []>;

  abstract require(path: string): any;

}
