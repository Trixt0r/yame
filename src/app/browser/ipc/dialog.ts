import { IpcAction } from './interface';
import { ipcMain, dialog } from 'electron';
import * as Promise from 'bluebird';

export class IpcDialog implements IpcAction {

  /** @inheritdoc */
  public init(): Promise<any> {
    ipcMain.on('dialog:open', (event, options, id) => {
      if (id)
        event.sender.send(`dialog:open:${id}`, dialog.showOpenDialog(options));
      else
        event.sender.send('dialog:open', dialog.showOpenDialog(options));
    });
    return Promise.resolve();
  }
}