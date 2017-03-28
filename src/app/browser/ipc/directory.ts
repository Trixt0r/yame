import { Directory } from '../../common/io/directory';
import { IpcAction } from './interface';
import { ipcMain } from 'electron';
import * as Promise from 'bluebird';

export class IpcDirectory implements IpcAction {

  /** @inheritdoc */
  public init(): Promise<any> {
    ipcMain.on('directory:scan', (event, dirpath: string, id: string, deep = true) => {
        let dir = new Directory(dirpath);
        dir.on('scan:file', file => event.sender.send(`directory:scan:${id}:file`, file) );
        dir.on('scan:dir', dir => event.sender.send(`directory:scan:${id}:dir`, dir.path) );
        dir.on('scan:dir:done', dir => event.sender.send(`directory:scan:${id}:dir:done`, dir.toJSON()) );
        dir.on('scan:done', () => event.sender.send(`directory:scan:${id}:done`, dir.toJSON()) );
        dir.on('scan:fail', e => event.sender.send(`directory:scan:${id}:fail`, e) );
        dir.scan(false, deep);
    });
    return Promise.resolve();
  }
}