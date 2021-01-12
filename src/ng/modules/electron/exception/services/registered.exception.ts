import { ElectronProvider } from '../../electron.provider';
import { Type } from '@angular/core';
import { ElectronServiceException } from '../service.exception';

export class ElectronProviderAlreadyRegistered<T extends ElectronProvider> extends ElectronServiceException<T> {

  constructor(protected clazz: Type<T>) {
    super (`Provider with name ${clazz.name} has been already registered`, clazz);
  }

}
