import { IpcAction } from './abstract';
import * as electron from 'electron';
declare type Electron = typeof electron;

/**
 * Ipc action for opening dialogs
 *
 * @class IpcDialog
 * @extends {IpcAction}
 */
export class IpcDialog extends IpcAction {

  /** @inheritdoc */
  public init(electron: Electron): Promise<any> {
    electron.ipcMain.on('dialog:open', (event, options, id) => {
      if (id) {
        event.sender.send(`dialog:open:${id}`, electron.dialog.showOpenDialog(options));
      } else {
        event.sender.send('dialog:open', electron.dialog.showOpenDialog(options));
      }
    });
    this.internalInitialized = true;
    return Promise.resolve();
  }
}
