import { DirectoryProviderException } from '../exception/providers/directory.exception';
import { ElectronProvider } from '../electron.provider';
import { uniqueId } from 'lodash';
import { IpcRendererEvent } from 'electron/main';
import { IResource } from 'common/interfaces/resource';

export class FileProvider extends ElectronProvider {

  /**
   * Scans the given file via electron.
   *
   * @param uri The file path to load.
   * @return The content of the given file.
   */
  async scan(uri: string): Promise<IResource> {
    return new Promise((resolve, reject) => {
      const id = uniqueId('directory-');
      this.ipc.send('file:scan', uri, id);
      this.ipc.once(`file:scan:${id}:done`, (event: IpcRendererEvent, resource: IResource) => {
        this.ipc.removeAllListeners(`file:scan:${id}:fail`);
        resolve(resource);
      });
      this.ipc.once(`file:scan:${id}:fail`, (event: IpcRendererEvent, e: Error) => {
        this.ipc.removeAllListeners(`file:scan:${id}:done`);
        reject(new DirectoryProviderException(e.message));
      });
    });
  }

}
