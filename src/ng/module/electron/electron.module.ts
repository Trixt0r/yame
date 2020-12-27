import { DirectoryProvider } from './providers/directory.provider';
import { DialogProvider } from './providers/dialog.provider';
import { NgModule } from '@angular/core';
import { ElectronService } from './electron.service';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import { LoadAssetResource, LoadFromAssetsSource, ScanResource } from 'ng/module/asset/states/actions/asset.action';

@NgModule({
  providers: [ElectronService],
})
export class ElectronModule {
  constructor(electron: ElectronService, actions: Actions, store: Store) {
    electron.registerProvider(DialogProvider).registerProvider(DirectoryProvider);

    actions.pipe(ofActionDispatched(LoadFromAssetsSource)).subscribe(async (action: LoadFromAssetsSource) => {
      if (action.source.type !== 'local') return;
      const dialog = electron.getProvider(DialogProvider);
      try {
        const folder = (await dialog.open({ properties: ['openDirectory'] }))[0];
        if (!folder) return;
        store.dispatch(new ScanResource(folder, action.source.type));
      } catch (e) {}
    });

    actions.pipe(ofActionDispatched(ScanResource)).subscribe(async (action: ScanResource) => {
      if (action.source !== 'local') return;
      const directory = electron.getProvider(DirectoryProvider);
      const content = await directory.scan(action.uri.replace('file:///', ''), false);
      store.dispatch(new LoadAssetResource(content));
    });
  }
}
