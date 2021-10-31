import { YamePlugin, IPluginConfig } from './plugin';
import { IYameEnvironment } from './interfaces/environment';
import { uniqueId } from 'lodash';

interface PluginPaths {
  [key: string]: string;
}

/**
 * The plugin manager handles the installation, activation and initialization of yame plugins.
 *
 * In order to get initialized, the plugin has to be a node module.
 * This means that the entry point of the plugin is defined in the `package.json` under `main`.
 */
export abstract class CommonPluginManager {

  /**
   * Determines, which type of code this manager will load.
   * Either `electron` or `ng`.
   */
  protected abstract type: string;

  /**
   * Defines the yame environment of the manager.
   */
  protected abstract environment: IYameEnvironment;

  /**
   * Mapping for plugin id to the package.json of the plugin.
   */
  protected pluginPaths: PluginPaths = { };

  /**
   * Attempts to initialize the given plugin files.
   *
   * @protected
   * @param files Files inside the plugin directories.
   * @return Resolves if done.
   */
  protected initializeFromFiles(files: string[]): Promise<unknown> {
    const promises: Promise<unknown>[] = [];
    files.forEach(file => {
      try {
        const config: IPluginConfig = this.require(this.require('path').resolve(`${file}`, 'package.json'));
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
          plugin.id = (config.name || uniqueId('yame-plugin-'));
        this.pluginPaths[plugin.id] = file;
        plugin.environment = this.environment;
        plugin.config.file = file;
        if (!plugin.isActive)
          // tslint:disable-next-line:no-console
          return console.info('Plugin', config.name, 'is deactivated');
        promises.push(
          plugin.initialize(this.type)
            .then(() => plugin.isInitialized = true)
            .catch(e => console.warn('Error occurred while loading plugin ', file, e.message))
        );
      } catch (e) {
        // TODO: log this in a persistent place
        console.error('require error', e);
      }
    });
    return Promise.all(promises);
  }

  /**
   * Initializes all plugins.
   *
   * @return Resolves on success.
   */
  initialize(): Promise<unknown> {
    return this.getFiles()
            .then(files => this.initializeFromFiles(files));
  }

  /**
   * Finalizes all plugins.
   *
   * @return
   */
  finalize(): Promise<unknown> {
    const proms = this.environment.plugins.map(plugin => {
      return typeof plugin.finalize === 'function' ? plugin.finalize() : Promise.resolve();
    });
    return Promise.all(proms)
            .catch(e => console.error('Finalizing plugins failed', e));
  }

  /**
   * Persists the config for the given plugin.
   *
   * @todo Write to local user storage and not to the pacakge json.
   * @param plugin
   * @return
   */
  protected abstract persistConfig(plugin: YamePlugin): Promise<unknown>;

  /**
   * Activates the plugin with the given id.
   *
   * @param id
   * @return Resolves on success.
   */
  activate(id: string): Promise<unknown> {
    const plugin = this.environment.plugins.find(it => it.id === id);
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
   * @param id
   * @returns Resolves on success.
   */
  deactivate(id: string): Promise<unknown> {
    const plugin = this.environment.plugins.find(it => it.id === id);
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
   */
  abstract getFiles(): Promise<string []>;

  /**
   * Requires the module for the given file path.
   */
  abstract require(path: string): any;

}
