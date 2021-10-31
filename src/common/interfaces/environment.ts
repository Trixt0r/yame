import { IConfig } from "./config";
import { YamePlugin } from "../plugin";

/**
 * The yame environment on the electron side.
 * This can actually contain any attributes, but the defined one in the interface are always accessible.
 *
 * @interface YameEnvironment
 */
export interface IYameEnvironment {

  /**
   * A list of all successfully initialized plugins.
   */
  plugins: YamePlugin[];

  /**
   * The app directory, i.e. the root of the electron and ng modules.
   */
  appDir: string;

  /**
   * The common directory, i.e. the source of the common modules.
   */
  commonDir: string;

  /**
   * The angular directory, i.e. the source of the angular code.
   */
  ngDir: string;

  /**
   * The electron directory, i.e. the source of the electron code.
   */
  electronDir: string;

  /**
   * The config.
   */
  config: IConfig;

  /**
   * Any additional config.
   */
  [key: string]: any;
}
