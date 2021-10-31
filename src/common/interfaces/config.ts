/**
 * Defines the schema of the config.json in yame.
 */
export interface IConfig {

  /**
   * Whether dev mode is active.
   *
   * @type {boolean}
   */
  devMode?: boolean;

  /**
   * Whether debug mode is active.
   *
   * @type {boolean}
   */
  debugMode?: boolean;

  /**
   * The yame plugins path.
   * This attribute can have a single path or multiple directories or files.
   * It is recommended to use glob patterns.
   *
   * @type {(string | string[])}
   */
  plugins?: string | string[]
}
