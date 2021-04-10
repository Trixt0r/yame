import { dialog, ipcMain } from 'electron';
import { IpcAction } from './abstract';

/**
 * Ipc action for triggering save- and open-dialogs.
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

    ipcMain.on('dialog:save', async (event, options, id) => {
      const result = await dialog.showSaveDialog(options);
      if (id) {
        event.sender.send(`dialog:save:${id}`, result);
      } else {
        event.sender.send('dialog:save', result);
      }
    });
    this._initialized = true;
  }
}
