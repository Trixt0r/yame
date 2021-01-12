import { CommonPluginManager } from 'common/plugin.manager';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import * as _ from 'lodash';
import { IYameEnvironment } from 'common/interfaces/environment';
import { Environment } from '../../environment';
import { YamePlugin } from 'common/plugin';

/**
 * Plugin manager for the angular side of the editor.
 */
export class PluginManager extends CommonPluginManager {
  /**
   * @inheritdoc
   */
  protected environment: IYameEnvironment = Environment;

  /**
   * @inheritdoc
   */
  protected type = 'ng';

  protected persistConfig(plugin: YamePlugin): Promise<unknown> {
    return Promise.resolve();
  }

  /**
   * @inheritdoc
   */
  require(path: string) {
    return (<any>global).require(path);
  }

  /**
   * @inheritdoc
   */
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
