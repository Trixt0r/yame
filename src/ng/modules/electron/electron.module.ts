import { DirectoryProvider } from './providers/directory.provider';
import { DialogProvider } from './providers/dialog.provider';
import { NgModule } from '@angular/core';
import { ElectronService } from './electron.service';
import { Actions, ofActionDispatched, ofActionSuccessful, Store } from '@ngxs/store';
import {
  LoadAssetResource,
  LoadFromAssetsSource,
  ScanResource,
  SelectAssetGroup,
} from 'ng/modules/asset/states/actions/asset.action';
import { AssetState } from '../asset/states/asset.state';
import { Subject } from 'rxjs';
import { IResource } from 'common/interfaces/resource';
import { FileProvider } from './providers/file.provider';
import { Keydown } from 'ng/states/hotkey.state';
import { ZoomCameraOut } from '../camera/states/actions/camera.action';
import { LoadEditorFile, SaveEditorFile } from 'ng/states/actions/editor.action';

const loaded$ = new Subject<IResource>();

const protocol = 'file:///';

@NgModule()
export class ElectronModule {
  constructor(electron: ElectronService, actions: Actions, store: Store, assetState: AssetState) {
    electron.registerProvider(DialogProvider, DirectoryProvider, FileProvider);
    actions.pipe(ofActionDispatched(LoadFromAssetsSource)).subscribe(async (action: LoadFromAssetsSource) => {
      if (action.source.type !== 'local') return;
      const dialog = electron.getProvider(DialogProvider);
      try {
        const folder = (await dialog.open({ properties: ['openDirectory'] }))[0];
        if (!folder) return;
        await store.dispatch(new ScanResource(folder, action.source.type)).toPromise();
        const sub = loaded$.subscribe(resource => {
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

    actions.pipe(ofActionSuccessful(Keydown)).subscribe(async (action: Keydown) => {
      if (action.shortcut.id !== 'save' && action.shortcut.id !== 'save.as') return;
      const currentFile = store.snapshot().editor.currentFile;
      const dialog = electron.getProvider(DialogProvider);
      const uri =
        currentFile.uri && action.shortcut.id !== 'save.as'
          ? currentFile.uri
          : (await dialog.save({ properties: ['openFile'] as any })).replace(protocol, '');
      const state = await store.dispatch(new SaveEditorFile({ uri, protocol, source: 'local', data: {} })).toPromise();
      const toSave = state.editor.currentFile.data;
      electron.getProvider(FileProvider).write(uri, JSON.stringify(toSave));
    });

    actions.pipe(ofActionSuccessful(Keydown)).subscribe(async (action: Keydown) => {
      if (action.shortcut.id !== 'open') return;
      const dialog = electron.getProvider(DialogProvider);
      const uri = (await dialog.open({ properties: ['openFile'] }))[0].replace(protocol, '');
      const content = (await electron.getProvider(FileProvider).read(uri)) as string;
      store.dispatch(new LoadEditorFile({ uri, protocol, source: 'local', data: JSON.parse(content) }));
      const sub = loaded$.subscribe(resource => {
        sub.unsubscribe();
        const asset = assetState.getAssetForResource(resource);
        if (!asset) return console.warn(`[Electron] Could not found asset for uri ${resource.uri}`);
        store.dispatch(new SelectAssetGroup(asset));
        setTimeout(() => store.dispatch(new ZoomCameraOut('main')), 1000 / 10);
      });
    });

    // TODO: move to main and use ipc messages
    // const menu = new Menu();
    // menu.append(
    //   new MenuItem({
    //     label: 'File',
    //     submenu: [
    //       {
    //         label: 'New File',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'new.file', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+N',
    //       },
    //       {
    //         label: 'New Window',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'new.window', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+Shift+N',
    //       },
    //       {
    //         type: 'separator',
    //       },
    //       {
    //         label: 'Open File',
    //         click: (event: unknown) => {
    //           console.log(new Error().stack);
    //           store.dispatch(new Keydown({ id: 'open', label: '' }, event as any));
    //         },
    //         accelerator: 'CommandOrControl+O',
    //       },
    //       {
    //         type: 'separator',
    //       },
    //       {
    //         label: 'Save',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'save', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+S',
    //       },
    //       {
    //         label: 'Save as...',
    //         accelerator: 'CommandOrControl+Shift+S',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'save.as', label: '' }, event as any)),
    //       },
    //       {
    //         type: 'separator',
    //       },
    //       {
    //         label: 'Exit',
    //         click: () => (event: unknown) => store.dispatch(new Keydown({ id: 'file.close', label: '' }, event as any)),
    //       },
    //     ],
    //   })
    // );
    // menu.append(
    //   new MenuItem({
    //     label: 'Edit',
    //     submenu: [
    //       {
    //         label: 'Undo',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'undo', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+Z',
    //       },
    //       {
    //         label: 'Redo',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'redo', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+Y',
    //       },
    //       {
    //         type: 'separator',
    //       },
    //       {
    //         label: 'Cut',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'cut', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+X',
    //       },
    //       {
    //         label: 'Copy',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'copy', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+C',
    //       },
    //       {
    //         label: 'Paste',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'paste', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+V',
    //       },
    //       {
    //         label: 'Remove',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'remove', label: '' }, event as any)),
    //         accelerator: 'Delete',
    //       },
    //       {
    //         type: 'separator',
    //       },
    //       {
    //         label: 'Select all',
    //         click: (event: unknown) => store.dispatch(new Keydown({ id: 'select.all', label: '' }, event as any)),
    //         accelerator: 'CommandOrControl+A',
    //       },
    //     ],
    //   })
    // );
  }
}
