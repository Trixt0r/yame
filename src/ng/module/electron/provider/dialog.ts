import { DialogProviderException } from '../exception/provider/dialog';
import { ElectronProvider } from '../provider';
import * as _ from 'lodash';

export class DialogProvider extends ElectronProvider {

  /**
   * Opens a native dektop dialog for selecting file(s) or folder(s).
   *
   * @param {Electron.OpenDialogOptions} options
   * @returns {Promise<string[]>} A list of file paths
   */
  open(options: Electron.OpenDialogOptions): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let id = _.uniqueId('dialog-');
      this.ipc.send('dialog:open', options, id);
      this.ipc.once(`dialog:open:${id}`, (event, files) => {
        if (files && files.length) resolve(files);
        else reject(new DialogProviderException('No files chosen'));
      });
    });
  }

}
