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
      this.ipc.send('file:scan', uri);
      this.ipc.once(`file:scan:${uri}:done`, (event: IpcRendererEvent, resource: IResource) => {
        this.ipc.removeAllListeners(`file:scan:${uri}:fail`);
        resolve(resource);
      });
      this.ipc.once(`file:scan:${uri}:fail`, (event: IpcRendererEvent, e: Error) => {
        this.ipc.removeAllListeners(`file:scan:${uri}:done`);
        reject(new DirectoryProviderException(e.message));
      });
    });
  }

  async read(uri: string): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
      this.ipc.send('file:read', uri);
      this.ipc.once(`file:read:${uri}:done`, (event: IpcRendererEvent, data: string | Buffer) => {
        this.ipc.removeAllListeners(`file:read:${uri}:fail`);
        resolve(data);
      });
      this.ipc.once(`file:read:${uri}:fail`, (event: IpcRendererEvent, e: Error) => {
        this.ipc.removeAllListeners(`file:read:${uri}:done`);
        reject(new DirectoryProviderException(e.message));
      });
    });
  }

  async write(uri: string, data: string, encoding?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ipc.send('file:write', uri, data, encoding);
      this.ipc.once(`file:write:${uri}:done`, (event: IpcRendererEvent) => {
        this.ipc.removeAllListeners(`file:scan:${uri}:fail`);
        resolve();
      });
      this.ipc.once(`file:write:${uri}:fail`, (event: IpcRendererEvent, e: Error) => {
        this.ipc.removeAllListeners(`file:write:${uri}:done`);
        reject(new DirectoryProviderException(e.message));
      });
    });
  }

}
