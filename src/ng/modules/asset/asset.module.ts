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
import { RegisterAssetIcon, RegisterAssetTypeLabel } from './states/actions/asset.action';
import { AssetDetailsDirective } from './directives/details.directive';
import { ImageAssetDetailsComponent } from './components/details/image/image.component';
import { AssetState } from './states/asset.state';
import { AssetPreviewComponent } from './decorators/preview.decorator';
import { AssetDetailsComponent } from './decorators/details.decorator';

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
      },
      deps: [ Store ],
      multi: true,
    }
  ]
})
export class AssetModule { }
