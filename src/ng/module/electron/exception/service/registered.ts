import { ElectronProvider } from '../../provider';
import { Type } from '@angular/core';
import { ElectronServiceException } from '../service';

export class ElectronProviderAlreadyRegistered<T extends ElectronProvider> extends ElectronServiceException<T> {

  constructor(protected clazz: Type<T>) {
    super (`Provider with name ${clazz.name} has been already registered`, clazz);
  }

}
