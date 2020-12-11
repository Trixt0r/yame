import { ElectronProviderAlreadyRegistered } from './exception/service/registered';
import { ElectronProviderNotFound } from './exception/service/not-found';
import { Injectable, Type } from '@angular/core';
import { ElectronProvider } from './provider';

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
   * @template T
   * @param {Type<T>} clazz The class of the electron provider.
   * @chainable
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
   * @template T
   * @param {Type<T>} clazz
   * @returns {T} The instance for the given
   */
  getProvider<T extends ElectronProvider>(clazz: Type<T>): T {
    if (!this.providers[clazz.name])
      throw new ElectronProviderNotFound(clazz);
    return <T>this.providers[clazz.name];
  }

}
