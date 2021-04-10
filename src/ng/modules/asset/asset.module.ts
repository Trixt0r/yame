import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UtilsModule } from '../utils';
import { MaterialModule } from '../material.module';
import { DndModule } from 'ng2-dnd';
import { AssetItemsComponent } from './components/items/items.component';
import { AssetPanelComponent } from './components/panel/panel.component';
import { AssetGroupsComponent } from './components/groups/groups.component';
import { TreeModule } from 'angular-tree-component';
import { AssetPreviewDirective } from './directives/preview.directive';
import { DefaultAssetPreviewComponent } from './components/previews/default/default.component';
import { ImageAssetPreviewComponent } from './components/previews/image/image.component';
import { NgxsModule, Store } from '@ngxs/store';
import { NgBytesPipeModule } from 'angular-pipes';
import { RegisterAssetIcon, RegisterAssetTypeLabel, ResetAssets, ScanResource } from './states/actions/asset.action';
import { AssetDetailsDirective } from './directives/details.directive';
import { ImageAssetDetailsComponent } from './components/details/image/image.component';
import { AssetState, IAssetState } from './states/asset.state';
import { AssetPreviewComponent } from './decorators/preview.decorator';
import { AssetDetailsComponent } from './decorators/details.decorator';
import { AddEditorFileProcessor } from 'ng/states/actions/editor.action';
import { PlatformPath } from 'path';
import { Asset } from 'common/asset';
import { IFileState } from 'ng/states/editor.state';

// Normally those components would be decorated with those functions.
// But since it does not work for the prod mode, the components have to be registered this way.
AssetPreviewComponent('png', 'jpg', 'jpeg', 'gif', 'svg')(ImageAssetPreviewComponent);
AssetDetailsComponent('png', 'jpg', 'jpeg', 'gif', 'svg')(ImageAssetDetailsComponent);

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    MaterialModule,
    NgBytesPipeModule ,
    TreeModule.forRoot(),
    DndModule.forRoot(),
    NgxsModule.forFeature([AssetState])
  ],
  declarations: [
    AssetItemsComponent,
    AssetGroupsComponent,
    AssetPanelComponent,
    DefaultAssetPreviewComponent,
    ImageAssetPreviewComponent,
    ImageAssetDetailsComponent,
    AssetPreviewDirective,
    AssetDetailsDirective
  ],
  exports: [
    AssetItemsComponent,
    AssetGroupsComponent,
    AssetPanelComponent,
    AssetPreviewDirective
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => () => {
        store.dispatch([
          new RegisterAssetIcon('image', ['png', 'gif', 'jpg', 'jpeg', 'svg']),
          new RegisterAssetTypeLabel('asset.type.image', ['png', 'gif', 'jpg', 'jpeg', 'svg'])
        ]);

        const path = (global as any).require('path') as PlatformPath;
        store.dispatch(new AddEditorFileProcessor({
          key: 'assets',
          async serialize(fileState, context) {
            const uri = context.uri;
            const protocol = context.protocol;
            const assetState = store.selectSnapshot((state) => state.assets) as IAssetState;
            return assetState.assets
              .filter((asset) => !asset.parent)
              .map((asset) => ({
                id: './' + path.relative(path.dirname(uri), asset.id.replace(protocol, '')).replace(/\\/g, '/'),
                resource: {
                  uri: './' + path.relative(path.dirname(uri), asset.resource.uri.replace(protocol, '')).replace(/\\/g, '/'),
                  source: asset.resource.source,
                },
              }));
          },
          async deserialize(fileState: IFileState<{ assets: Asset[] }>, context) {
            const uri = context.uri;
            const protocol = context.protocol;
            const scans = fileState.data!.assets.map(
              (asset) =>
                new ScanResource(
                  path.resolve(path.dirname(uri), asset.resource.uri.replace(protocol, '')),
                  asset.resource.source
                )
            );
            await store.dispatch(new ResetAssets());
            return store.dispatch(scans).toPromise();
          }
        }));
      },
      deps: [ Store ],
      multi: true,
    }
  ]
})
export class AssetModule { }
