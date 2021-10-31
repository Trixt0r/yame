import { BrowserWindow, App } from 'electron';
import { IYameEnvironment } from 'common/interfaces/environment';

/**
 * The yame environment on the electron side.
 * This can actually contain any attributes, but the defined one in the interface are always accessible.
 */
export interface IYameElectronEnvironment extends IYameEnvironment {

  /**
   * The main window of the editor.
   */
  window: BrowserWindow | null;

  /**
   * The electron app itself.
   */
  app: App | null;
}

const env: IYameElectronEnvironment = {
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
