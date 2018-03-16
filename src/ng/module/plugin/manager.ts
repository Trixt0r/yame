import { CommonPluginManager } from "common/plugin-manager";
import { ipcRenderer } from 'electron';
import * as _ from 'lodash';
import { YameEnvironment } from "../../../common/interface/environment";
import { Environment } from "../../environment";

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

  /** @inheritdoc */
  require(path: string) {
    return (<any>global).require(path);
  }

  /** @inheritdoc */
  getFiles(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const id = _.uniqueId('plugins-');
      let resolver, rejecter;
      resolver = (event, files: string[]) => {
        ipcRenderer.removeListener(`plugins:files:${id}:error`, rejecter);
        resolve(files);
      };
      rejecter = (event, message: string) => {
        ipcRenderer.removeListener(`plugins:files:${id}`, resolver);
        reject(new Error(message));
      };
      ipcRenderer.once(`plugins:files:${id}`, resolver);
      ipcRenderer.once(`plugins:files:${id}:error`, rejecter);
      ipcRenderer.send(`plugins:files`, id);
    });
  }
}
