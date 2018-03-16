import { Config } from "./config";
import { Plugin } from "./plugin";

/**
 * The yame environment on the electron side.
 * This can actually contain any attributes, but the defined one in the interface are always accessable.
 *
 * @interface YameEnvironment
 */
export interface YameEnvironment {

  /**
   * A list of all successfully initialized plugins.
   *
   * @type {Plugin[]}
   */
  plugins: Plugin[];

  /**
   * The app directory, i.e. the root of the electron and ng modules.
   *
   * @type {string}
   */
  appDir: string;

  /**
   * The common directory, i.e. the source of the common modules.
   *
   * @type {string}
   */
  commonDir: string;

  /**
   * The angular directory, i.e. the source of the angular code.
   *
   * @type {string}
   */
  ngDir: string;

  /**
   * The electron directory, i.e. the source of the electron code.
   *
   * @type {string}
   */
  electronDir: string;

  /**
   * The config.
   *
   * @type {Config}
   */
  config: Config;

  // anything else, maybe written by plugins
  [key: string]: any;
}
