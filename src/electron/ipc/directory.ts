import { Directory } from '../io/directory';
import { IpcAction } from './abstract';
import * as electron from 'electron';
declare type Electron = typeof electron;

/**
 * Ipc action for scanning directories.
 *
 * @class IpcDirectory
 * @extends {IpcAction}
 */
export class IpcDirectory extends IpcAction {

  /**
   * @inheritdoc
   */
  async init(): Promise<void> {
    electron.ipcMain.on('directory:scan', (event, dirpath: string, id: string, deep = true) => {
        const directory = new Directory(dirpath);
        directory.on('scan:file', file => event.sender.send(`directory:scan:${id}:file`, file) );
        directory.on('scan:dir', dir => event.sender.send(`directory:scan:${id}:dir`, dir.path) );
        directory.on('scan:dir:done', dir => event.sender.send(`directory:scan:${id}:dir:done`, dir.export()) );
        directory.on('scan:done', () => event.sender.send(`directory:scan:${id}:done`, directory.export()) );
        directory.on('scan:fail', e => event.sender.send(`directory:scan:${id}:fail`, e) );
        directory.scan(false, deep);
    });
    this._initialized = true;
  }
}
