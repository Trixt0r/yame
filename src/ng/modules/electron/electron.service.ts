import { ElectronProviderAlreadyRegistered } from './exception/services/registered.exception';
import { ElectronProviderNotFound } from './exception/services/not-found.exception';
import { Injectable, Type } from '@angular/core';
import { ElectronProvider } from './electron.provider';

/**
 * The electron service provides functionality for registering electron providers.
 * Electron providers can be used to abstract and simplify the usage for the ipc communication between
 * the browser process and the renderer process.
 */
@Injectable({ providedIn: 'root' })
export class ElectronService {
  private providers: Record<string, ElectronProvider> = {};

  /**
   * Reference to the ipc renderer
   */
  get ipc() {
    return (global as any).require('electron').ipcRenderer;
  }

  /**
   * Registers electron providers.
   * Registering means creating an instance of the electron provider class and storing it in the internal registry.
   *
   * @param types The types to register.
   */
  registerProvider(...types: Type<ElectronProvider>[]): void {
    types.forEach(type => {
      if (this.providers[type.name]) throw new ElectronProviderAlreadyRegistered(type);
      this.providers[type.name] = new type(this);
    });
  }

  /**
   * Returns the provider instance for the given type.
   *
   * @param type
   * @return The instance for the given provider class.
   */
  getProvider<T extends ElectronProvider>(type: Type<T>): T {
    if (!this.providers[type.name]) throw new ElectronProviderNotFound(type);
    return <T>this.providers[type.name];
  }
}
