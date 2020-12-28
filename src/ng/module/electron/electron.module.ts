import { DirectoryProvider } from './providers/directory.provider';
import { DialogProvider } from './providers/dialog.provider';
import { NgModule } from '@angular/core';
import { ElectronService } from './electron.service';
import { Actions, ofActionDispatched, ofActionSuccessful, Store } from '@ngxs/store';
import { LoadAssetResource, LoadFromAssetsSource, ScanResource, SelectAssetGroup } from 'ng/module/asset/states/actions/asset.action';
import { AssetState } from '../asset/states/asset.state';
import { Subject } from 'rxjs';
import { IResource } from 'common/interfaces/resource';

@NgModule({
  providers: [ElectronService],
})
export class ElectronModule {
  constructor(electron: ElectronService, actions: Actions, store: Store, assetState: AssetState) {
    electron.registerProvider(DialogProvider).registerProvider(DirectoryProvider);

    const loaded$ = new Subject<IResource>();
    actions.pipe(ofActionDispatched(LoadFromAssetsSource)).subscribe(async (action: LoadFromAssetsSource) => {
      if (action.source.type !== 'local') return;
      const dialog = electron.getProvider(DialogProvider);
      try {
        const folder = (await dialog.open({ properties: ['openDirectory'] }))[0];
        if (!folder) return;
        await store.dispatch(new ScanResource(folder, action.source.type)).toPromise();
        const sub = loaded$.subscribe((resource) => {
                            sub.unsubscribe();
                            const asset = assetState.getAssetForResource(resource);
                            if (!asset) return console.warn(`[Electron] Could not found asset for uri ${folder}`);
                            store.dispatch(new SelectAssetGroup(asset));
                          });
      } catch (e) {}
    });

    actions.pipe(ofActionDispatched(ScanResource)).subscribe(async (action: ScanResource) => {
      if (action.source !== 'local') return;
      const directory = electron.getProvider(DirectoryProvider);
      const content = await directory.scan(action.uri.replace('file:///', ''), false);
      await store.dispatch(new LoadAssetResource(content)).toPromise();
      loaded$.next(content);
    });
  }
}
