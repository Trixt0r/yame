import { DirectoryProvider } from './electron/provider/directory';
import { DialogProvider } from './electron/provider/dialog';
import { NgModule } from '@angular/core';
import { ElectronService } from './electron/service';

@NgModule({
  providers: [ElectronService]
})
export class ElectronModule {
  constructor(electron: ElectronService) {
    electron.registerProvider(DialogProvider)
            .registerProvider(DirectoryProvider);
  }
}
