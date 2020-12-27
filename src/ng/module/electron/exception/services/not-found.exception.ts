import { ElectronProvider } from '../../electron.provider';
import { Type } from '@angular/core';
import { ElectronServiceException } from '../service.exception';

export class ElectronProviderNotFound<T extends ElectronProvider> extends ElectronServiceException<T> {

  constructor(protected clazz: Type<T>) {
    super(`No electron provider found for ${clazz.name}`, clazz);
  }

}
