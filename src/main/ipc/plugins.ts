import { IpcAction } from "./abstract";
import * as electron from 'electron';
import { PluginManager } from "../plugin/manager";

/**
 * Ipc action for reading plugin paths.
 *
 * @class IpcPlugins
 * @extends {IpcAction}
 */
export class IpcPlugins extends IpcAction {


  async init(): Promise<void> {
    electron.ipcMain.on('plugins:files', (event, id) => {
      PluginManager.getFiles()
        .then(files => {
          if (id) event.sender.send(`plugins:files:${id}`, files);
          else event.sender.send('plugins:files', files);
        })
      .catch(e => {
        console.log(e);
        if (id) event.sender.send(`plugins:files:${id}:eror`, e.message);
        else event.sender.send('plugins:files:error', e.message);
      });
    });
    this._initialized = true;
  }
}
