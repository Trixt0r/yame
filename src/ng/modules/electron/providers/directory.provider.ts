import { DirectoryProviderException } from '../exception/providers/directory.exception';
import { ElectronProvider } from '../electron.provider';
import { uniqueId } from 'lodash';
import { IpcRendererEvent } from 'electron/main';
import { IResource } from 'common/interfaces/resource';

export class DirectoryProvider extends ElectronProvider {

  /**
   * Scans the given directory via electron.
   *
   * @param dir The directory to load.
   * @param deep Whether to load all nested folders.
   * @return The content of the given directory.
   */
  async scan(dir: string, deep = true): Promise<IResource<IResource[]>> {
    return new Promise((resolve, reject) => {
      const id = uniqueId('directory-');
      this.ipc.send('directory:scan', dir, id, deep);
      this.ipc.once(`directory:scan:${id}:done`, (event: IpcRendererEvent, json: any) => {
        this.ipc.removeAllListeners(`directory:scan:${id}:fail`);
        resolve(json);
      });
      this.ipc.once(`directory:scan:${id}:fail`, (event: IpcRendererEvent, e: Error) => {
        this.ipc.removeAllListeners(`directory:scan:${id}:done`);
        reject(new DirectoryProviderException(e.message));
      });
    });
  }

}
