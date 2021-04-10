import { DialogProviderException } from '../exception/providers/dialog.exception';
import { ElectronProvider } from '../electron.provider';
import { IpcRendererEvent } from 'electron/main';
import { uniqueId } from 'lodash';

export class DialogProvider extends ElectronProvider {

  /**
   * Opens a native desktop dialog for selecting file(s) or folder(s).
   *
   * @param options Options to be passed to the electron dialog provider.
   * @return A list of file paths
   */
  open(options: Electron.OpenDialogOptions): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const id = uniqueId('dialog-');
      this.ipc.send('dialog:open', options, id);
      this.ipc.once(`dialog:open:${id}`, (event: IpcRendererEvent, dialog: { filePaths: string[] }) => {
        if (dialog && dialog.filePaths && dialog.filePaths.length > 0) resolve(dialog.filePaths);
        else reject(new DialogProviderException('No files chosen'));
      });
    });
  }

  async save(options: Electron.SaveDialogOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = uniqueId('dialog-');
      this.ipc.send('dialog:save', options, id);
      this.ipc.once(`dialog:save:${id}`, (event: IpcRendererEvent, dialog: { filePath: string }) => {
        if (dialog && dialog.filePath) resolve(dialog.filePath);
        else reject(new DialogProviderException('No files chosen'));
      });
    });
  }

}
