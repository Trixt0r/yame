import { Directory } from '../../common/io/directory';
import { IpcAction } from './abstract';
import * as electron from 'electron';
declare type Electron = typeof electron;

/**
 *
 *
 * @export
 * @class IpcDirectory
 * @extends {IpcAction}
 */
export class IpcDirectory extends IpcAction {

  /** @inheritdoc */
  public init(electron: Electron): Promise<any> {
    electron.ipcMain.on('directory:scan', (event, dirpath: string, id: string, deep = true) => {
        let dir = new Directory(dirpath);
        dir.on('scan:file', file => event.sender.send(`directory:scan:${id}:file`, file) );
        dir.on('scan:dir', dir => event.sender.send(`directory:scan:${id}:dir`, dir.path) );
        dir.on('scan:dir:done', dir => event.sender.send(`directory:scan:${id}:dir:done`, dir.export()) );
        dir.on('scan:done', () => event.sender.send(`directory:scan:${id}:done`, dir.export()) );
        dir.on('scan:fail', e => event.sender.send(`directory:scan:${id}:fail`, e) );
        dir.scan(false, deep);
    });
    this.internalInitialized = true;
    return Promise.resolve();
  }
}
