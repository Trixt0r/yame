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
  public async init(electron: Electron): Promise<any> {
    electron.ipcMain.on('dialog:open', async (event, options, id) => {
      const result = await electron.dialog.showOpenDialog(options);
      if (id) {
        event.sender.send(`dialog:open:${id}`, result);
      } else {
        event.sender.send('dialog:open', result);
      }
    });
    this.internalInitialized = true;
  }
}
