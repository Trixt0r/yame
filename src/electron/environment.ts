import { BrowserWindow, App } from "electron";
import { YameEnvironment } from "common/interface/environment";

/**
 * The yame environment on the electron side.
 * This can actually contain any attributes, but the defined one in the interface are always accessable.
 *
 * @interface YameElectronEnvironment
 */
export interface YameElectronEnvironment extends YameEnvironment {

  /**
   * The main window of the editor.
   *
   * @type {BrowserWindow}
   */
  window: BrowserWindow | null;

  /**
   * The electron app itself.
   *
   * @type {App}
   */
  app: App | null;
}

const env: YameElectronEnvironment = {
  window: null,
  app: null,
  appDir: '',
  commonDir: '',
  ngDir: '',
  electronDir: '',
  config: { },
  plugins: []
};

export const Environment = env;
