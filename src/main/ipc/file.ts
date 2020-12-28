import { IpcAction } from './abstract';
import * as electron from 'electron';
import { File } from '../io/file';

/**
 * Ipc action for scanning files.
 */
export class IpcFile extends IpcAction {

  /**
   * @inheritdoc
   */
  async init(): Promise<void> {
    electron.ipcMain.on('file:scan', async (event, uri: string, id: string) => {
      const file = new File(uri);
      try {
        await file.getStats();
        event.sender.send(`file:scan:${id}:done`, file.export());
      } catch (e) {
        event.sender.send(`file:scan:${id}:fail`, e);
      }
    });
  }

}