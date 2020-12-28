import { NgModule } from '@angular/core';
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
import { Store } from '@ngxs/store';
import { NgBytesPipeModule } from 'angular-pipes';
import { RegisterAssetIcon } from './states/actions/asset.action';

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    MaterialModule,
    NgBytesPipeModule ,
    TreeModule.forRoot(),
    DndModule.forRoot()
  ],
  declarations: [
    AssetItemsComponent,
    AssetGroupsComponent,
    AssetPanelComponent,
    DefaultAssetPreviewComponent,
    ImageAssetPreviewComponent,
    AssetPreviewDirective
  ],
  exports: [
    AssetItemsComponent,
    AssetGroupsComponent,
    AssetPanelComponent,
    AssetPreviewDirective
  ]
})
export class AssetModule {
  constructor(store: Store) {
    store.dispatch(new RegisterAssetIcon('image', ['png', 'gif', 'jpg', 'jpeg', 'svg']));
  }
}
