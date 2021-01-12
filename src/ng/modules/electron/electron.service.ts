import { ElectronProviderAlreadyRegistered } from './exception/services/registered.exception';
import { ElectronProviderNotFound } from './exception/services/not-found.exception';
import { Injectable, Type } from '@angular/core';
import { ElectronProvider } from './electron.provider';

interface ElectronProviders {
  [key: string]: ElectronProvider;
}

/**
 * The electron service provides functionality for registering electron providers.
 * Electron providers can be used to abstract and simplify the usage for the ipc communication between
 * the browser process and the renderer process.
 *
 * @export
 * @class ElectronService
 */
@Injectable()
export class ElectronService {

  private providers: ElectronProviders = { };

  /**
   * @readonly
   * @type {Electron.IpcRenderer} Reference to the ipc renderer
   */
  get ipc() {
    return (global as any).require('electron').ipcRenderer;
  }

  /**
   * Registers an electron provider.
   * Registering means creating an instance of the electron provider class and storing it in the internal cache.
   *
   * @param clazz The class of the electron provider.
   */
  registerProvider<T extends ElectronProvider>(clazz: Type<T>): ElectronService {
    if (this.providers[clazz.name])
      throw new ElectronProviderAlreadyRegistered(clazz);
    this.providers[clazz.name] = new clazz(this);
    return this;
  }

  /**
   *
   *
   * @param clazz
   * @return The instance for the given provider class.
   */
  getProvider<T extends ElectronProvider>(clazz: Type<T>): T {
    if (!this.providers[clazz.name])
      throw new ElectronProviderNotFound(clazz);
    return <T>this.providers[clazz.name];
  }

}
