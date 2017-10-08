import { Injectable, Type } from '@angular/core';
import { ElectronProvider } from './provider';

interface ElectronProviders {
  [key: string]: ElectronProvider;
}

@Injectable()
export class ElectronService {

  private providers: ElectronProviders = { };

  get ipc() {
    return require('electron').ipcRenderer;
  }

  registerProvider<T extends ElectronProvider>(clazz: Type<T>): ElectronService {
    if (this.providers[clazz.name])
      throw `Provider with name ${clazz.name} has been already registered`;
    this.providers[clazz.name] = new clazz(this);
    return this;
  }

  getProvider<T extends ElectronProvider>(clazz: Type<T>): T {
    return <T>this.providers[clazz.name];
  }

}
