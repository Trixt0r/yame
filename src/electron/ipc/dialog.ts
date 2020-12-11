import { dialog, ipcMain } from 'electron';
import { IpcAction } from './abstract';

/**
 * Ipc action for opening dialogs
 *
 * @class IpcDialog
 * @extends {IpcAction}
 */
export class IpcDialog extends IpcAction {

  /** @inheritdoc */
  async init(): Promise<any> {
    ipcMain.on('dialog:open', async (event, options, id) => {
      const result = await dialog.showOpenDialog(options);
      if (id) {
        event.sender.send(`dialog:open:${id}`, result);
      } else {
        event.sender.send('dialog:open', result);
      }
    });
    this._initialized = true;
  }
}
