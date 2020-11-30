import { DirectoryProviderException } from '../exception/provider/directory';
import { DirectoryContent } from '../../../../common/content/directory';
import { ElectronProvider } from '../provider';
import { uniqueId } from 'lodash';

export class DirectoryProvider extends ElectronProvider {

  /**
   * Scans the given directory via electron.
   *
   * @param dir The directory to load.
   * @param [deep = true] Whether to load all nested folders.
   * @return The content of the given directory.
   */
  async scan(dir: string, deep = true): Promise<DirectoryContent> {
    return new Promise((resolve, reject) => {
      const id = uniqueId('directory-');
      this.ipc.send('directory:scan', dir, id, deep);
      this.ipc.once(`directory:scan:${id}:done`, (event, json) => {
        this.ipc.removeAllListeners(`directory:scan:${id}:fail`);
        resolve(json);
      });
      this.ipc.once(`directory:scan:${id}:fail`, (event, e) => {
        this.ipc.removeAllListeners(`directory:scan:${id}:done`);
        reject(new DirectoryProviderException(e.message));
      });
    });
  }

}
