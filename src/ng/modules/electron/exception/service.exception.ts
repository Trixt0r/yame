import { Type } from '@angular/core';
import { ElectronProvider } from '../electron.provider';
import { ElectronException } from '../electron.exception';

export class ElectronServiceException<T extends ElectronProvider> extends ElectronException {

  constructor(message: string, protected clazz: Type<T>) {
    super(message);
  }

  get provider(): Type<T> {
    return this.clazz;
  }
}
