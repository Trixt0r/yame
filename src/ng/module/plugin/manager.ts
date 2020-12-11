import { CommonPluginManager } from 'common/plugin-manager';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import * as _ from 'lodash';
import { YameEnvironment } from 'common/interface/environment';
import { Environment } from '../../environment';
import { YamePlugin } from 'electron/idx';

/**
 * Plugin manager for the angular side of the editor.
 *
 * @class PluginManager
 * @extends CommonPluginManager
 */
export class PluginManager extends CommonPluginManager {
  /** @inheritdoc */
  protected environment: YameEnvironment = Environment;

  /** @inheritdoc */
  protected type = 'ng';

  protected persistConfig(plugin: YamePlugin): Promise<unknown> {
    return Promise.resolve();
  }

  /** @inheritdoc */
  require(path: string) {
    return (<any>global).require(path);
  }

  /** @inheritdoc */
  getFiles(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const id = _.uniqueId('plugins-');
      let resolver: (event: IpcRendererEvent, files: string[]) => void, rejecter: (event: IpcRendererEvent, message: string) => void;
      resolver = (event: IpcRendererEvent, files: string[]) => {
        ipcRenderer.removeListener(`plugins:files:${id}:error`, rejecter);
        resolve(files);
      };
      rejecter = (event: IpcRendererEvent, message: string) => {
        ipcRenderer.removeListener(`plugins:files:${id}`, resolver);
        reject(new Error(message));
      };
      ipcRenderer.once(`plugins:files:${id}`, resolver);
      ipcRenderer.once(`plugins:files:${id}:error`, rejecter);
      ipcRenderer.send(`plugins:files`, id);
    });
  }
}
