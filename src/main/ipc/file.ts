import { IpcAction } from './abstract';
import { File } from '../io/file';
import { ipcMain } from 'electron';

/**
 * Ipc action for scanning files.
 */
export class IpcFile extends IpcAction {

  /**
   * @inheritdoc
   */
  async init(): Promise<void> {
    ipcMain.on('file:scan', async (event, uri: string) => {
      const file = new File(uri);
      try {
        await file.getStats();
        event.sender.send(`file:scan:${uri}:done`, file.export());
      } catch (e) {
        event.sender.send(`file:scan:${uri}:fail`, e);
      }
    });

    ipcMain.on('file:read', async (event, uri: string, encoding?: string) => {
      const file = new File(uri);
      try {
        await file.getStats();
        event.sender.send(`file:read:${uri}:done`, await file.read(encoding));
      } catch (e) {
        event.sender.send(`file:read:${uri}:fail`, e);
      }
    });

    ipcMain.on('file:write', async (event, uri: string, data: string, encoding?: string) => {
      const file = new File(uri);
      try {
        await file.write(data, encoding);
        event.sender.send(`file:write:${uri}:done`);
      } catch (e) {
        event.sender.send(`file:scan:${uri}:fail`, e);
      }
    });
  }

}