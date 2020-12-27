import { IYameEnvironment } from "./interfaces/environment";
import { EventEmitter } from 'eventemitter3';
import * as path from 'path';

interface IYamePluginConfig {
  /**
   * Whether the plugin is active or not.
   */
  active: boolean;

  /**
   * The electron entry point.
   */
  electron?: string;

  /**
   * The angular entry point.
   */
  ng?: string;
}

/**
 * Plugin configuration read from it's *.json file.
 */
export interface IPluginConfig {

  /**
   * The name of the plugin.
   *
   * @type {string}
   */
  name: string;

  /**
   * The yame specific configuration.
   *
   * @type {IYamePluginConfig}
   */
  yame: IYamePluginConfig;

  /**
   * The full path of the plugin.
   *
   * @type {string}
   */
  file: string;

  [key: string]: any;
}

/**
 * The plugin interface defines, what a plugin has to expose to the manager,
 * so it can be managed properly by the application.
 *
 * A plugin is an event emitter and should notify the main application by emitting events,
 * the plugin manager is listening to.
 *
 * @todo Define events which the plugin manager listens for.
 */
export class YamePlugin extends EventEmitter {

  /**
   * The identifier of the plugin.
   * This is unique, i.e. a second plugin with the same id can not be installed.
   * If not set by the plugin itself, it will be set by the plugin manager read from the name on the plugin's
   * package.json.
   */
  id!: string;

  /**
   * The yame environment.
   * This will be set by the plugin manager before executing any of the
   */
  environment!: IYameEnvironment;

  /**
   * The configuration of the plugin, i.e. the package.json config.
   */
  config!: IPluginConfig;

  /**
   * An optional priority value for the plugin.
   * Can be defined to get the plugin earlier initialized than the other plugins during startup.
   * A higher value means higher priority.
   * If no priority is defined, the plugin will be initialized with default priority (0).
   */
  priority?: number;

  /**
   * Tells whether the plugin is initialized.
   * This property will be set to `true` by the plugin manager after successfully calling @see {Plugin#initialize}.
   */
  isInitialized!: boolean;

  /**
   * Tells whether the plugin is active.
   * This property will be set to `true` by the plugin manager after successfully calling @see {Plugin#activate}.
   */
  isActive!: boolean;

  /**
   * Internal ng and electron directories.
   */
  private calculatedDirs!: string[];

  /**
   * Activates the plugin (again).
   * This will be executed when trying to switch the @see {Plugin#isActive} flag to `true`.
   * In any case the method will be executed after a successful installation.
   */
  activate?(): Promise<void>;

  /**
   * Deactivates the plugin.
   * This will be executed when trying to switch the @see {Plugin#isActive} flag to `false`.
   * This method will also be executed before uninstalling the plugin.
   */
  deactivate?(): Promise<void>;

  /**
   * Initializes the plugin.
   * This will be executed after initializing the main application by the plugin manager.
   *
   * @param type The application type, e.g. `ng` or `electron`.
   */
  initialize?(type: string): Promise<void>;

  /**
   * Stops the plugin.
   * This will be executed before the main app shuts down completely.
   */
  finalize?(): Promise<void>;

  /**
   * Resolves the ng and electron directories of this plugin.
   *
   * @return The ng and electron entry directories. Maybe empty.
   */
  get directories(): string[] {
    if (this.calculatedDirs) return this.calculatedDirs;
    this.calculatedDirs = [];
    if (!this.config.yame) return this.calculatedDirs;
    const dir = path.dirname(this.config.file);
    const config = this.config.yame;
    if (config.electron)
      this.calculatedDirs.push(path.dirname(path.resolve(dir, config.electron)));
    if (config.ng)
      this.calculatedDirs.push(path.dirname(path.resolve(dir, config.ng)));
    return this.calculatedDirs;
  }
}

