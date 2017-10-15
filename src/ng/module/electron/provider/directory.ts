import { DirectoryContent } from '../../../../common/content/directory';
import { ElectronProvider } from '../provider';
import * as _ from 'lodash';

export class DirectoryProvider extends ElectronProvider {

  /**
   * Scans the given directory via electron.
   *
   * @param {string} dir
   * @param {boolean} [deep=true]
   * @returns {Promise<DirectoryContent>}
   */
  scan(dir: string, deep = true): Promise<DirectoryContent> {
    return new Promise((resolve, reject) => {
      let id = _.uniqueId('directory-');
      this.ipc.send('directory:scan', dir, id, deep);
      this.ipc.once(`directory:scan:${id}:done`, (event, json) => {
        this.ipc.removeAllListeners(`directory:scan:${id}:fail`);
        resolve(json);
      });
      this.ipc.once(`directory:scan:${id}:fail`, (event, e) => {
        this.ipc.removeAllListeners(`directory:scan:${id}:done`);
        reject(e);
      });
    });
  }

}
