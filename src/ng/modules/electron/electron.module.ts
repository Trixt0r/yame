import { DirectoryProvider } from './providers/directory.provider';
import { DialogProvider } from './providers/dialog.provider';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { ElectronService } from './electron.service';
import { Actions, ofActionDispatched, ofActionSuccessful, Store } from '@ngxs/store';
import {
  LoadAssetResource,
  LoadFromAssetsSource,
  ResetAssets,
  ScanResource,
  SelectAssetGroup,
} from 'ng/modules/asset/states/actions/asset.action';
import { AssetState } from '../asset/states/asset.state';
import { Subject } from 'rxjs';
import { IResource } from 'common/interfaces/resource';
import { FileProvider } from './providers/file.provider';
import { AddShortcut, Keyup } from 'ng/states/hotkey.state';
import { SceneEntityData } from 'common/scene';
import { SceneService } from '../scene';
import { Asset } from 'common/asset';
import { ZoomCameraOut } from '../camera/states/actions/camera.action';
import { LoadEditorFile, SaveEditorFile } from 'ng/states/actions/editor.action';

const customTitlebar = (global as any).require('custom-electron-titlebar');
new customTitlebar.Titlebar({
  backgroundColor: customTitlebar.Color.fromHex('#252525'),
  closeable: true,
  icon: './assets/favicon.ico'
});

const loaded$ = new Subject<IResource>();

const protocol = 'file:///';

@NgModule({
  providers: [
    ElectronService,
    {
      provide: APP_INITIALIZER,
      useFactory: (
        electron: ElectronService,
        store: Store,
        actions: Actions,
        assetState: AssetState,
      ) => () => {
        store.dispatch([
          new AddShortcut({
            id: 'save',
            label: 'Save',
            keys: ['control.s'],
          }),
          new AddShortcut({
            id: 'open',
            label: 'Open',
            keys: ['control.o'],
          }),
        ]);

        actions.pipe(ofActionSuccessful(Keyup)).subscribe((action: Keyup) => {
          if (action.shortcut.id !== 'save') return;
          const dialog = electron.getProvider(DialogProvider);
          dialog.save({ properties: ['openFile'] as any }).then(async uri => {
            uri = uri.replace(protocol, '');
            const state = await store.dispatch(new SaveEditorFile({ uri, protocol, source: 'local' })).toPromise();
            const toSave = state.editor.currentFile.data;
            electron.getProvider(FileProvider).write(uri, JSON.stringify(toSave));
          });
        });

        actions.pipe(ofActionSuccessful(Keyup)).subscribe((action: Keyup) => {
          if (action.shortcut.id !== 'open') return;
          const dialog = electron.getProvider(DialogProvider);
          dialog.open({ properties: ['openFile'] }).then(async (re) => {
            const uri = re[0].replace(protocol, '');
            const content = (await electron.getProvider(FileProvider).read(uri)) as string;
            const data = JSON.parse(content) as { entities: SceneEntityData[]; assets: Asset[] };
            await store.dispatch(new LoadEditorFile(data, { uri, protocol, source: 'local' }));
            const sub = loaded$.subscribe((resource) => {
              sub.unsubscribe();
              const asset = assetState.getAssetForResource(resource);
              if (!asset) return console.warn(`[Electron] Could not found asset for uri ${resource.uri}`);
              store.dispatch(new SelectAssetGroup(asset));
              setTimeout(() => store.dispatch(new ZoomCameraOut()), 1000 / 10);
            });
          });
        });
      },
      deps: [ElectronService, Store, Actions, AssetState, SceneService],
      multi: true,
    },
  ],
})
export class ElectronModule {
  constructor(electron: ElectronService, actions: Actions, store: Store, assetState: AssetState) {
    electron.registerProvider(DialogProvider).registerProvider(DirectoryProvider).registerProvider(FileProvider);
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
          if (!asset) return console.warn(`[Electron] Could not found asset for uri ${resource.uri}`);
          store.dispatch(new SelectAssetGroup(asset));
        });
      } catch (e) {}
    });

    actions.pipe(ofActionDispatched(ScanResource)).subscribe(async (action: ScanResource) => {
      if (action.source !== 'local') return;
      const provider =
        action.type === 'group' ? electron.getProvider(DirectoryProvider) : electron.getProvider(FileProvider);
      const content = await provider.scan(action.uri.replace(protocol, ''), false);
      await store.dispatch(new LoadAssetResource(content, provider instanceof FileProvider)).toPromise();
      loaded$.next(content);
    });
  }
}
