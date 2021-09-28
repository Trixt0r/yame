import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAsDecorated, UtilsModule } from '../utils';
import { DndModule } from 'ng2-dnd';
import { AssetItemsComponent } from './components/items/items.component';
import { AssetPanelComponent } from './components/panel/panel.component';
import { AssetGroupsComponent } from './components/groups/groups.component';
import { AssetPreviewDirective } from './directives/preview.directive';
import { DefaultAssetPreviewComponent } from './components/previews/default/default.component';
import { NgxsModule, Store } from '@ngxs/store';
import { NgBytesPipeModule } from 'angular-pipes';
import { RegisterAssetIcon, RegisterAssetTypeLabel } from './states/actions/asset.action';
import { AssetDetailsDirective } from './directives/details.directive';
import { AssetState } from './states/asset.state';
import { ImageAssetPreviewComponent } from './components';
import { ImageAssetDetailsComponent } from './components/details/image/image.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    NzIconModule,
    NzButtonModule,
    NzDropDownModule,
    NzTreeModule,
    NzCardModule,
    NzLayoutModule,
    NzTabsModule,
    NzDividerModule,
    NzResultModule,
    NgBytesPipeModule,
    NzSpinModule,
    DndModule.forRoot(),
    NgxsModule.forFeature([AssetState]),
  ],
  declarations: [
    AssetItemsComponent,
    AssetGroupsComponent,
    AssetPanelComponent,
    DefaultAssetPreviewComponent,
    ImageAssetPreviewComponent,
    ImageAssetDetailsComponent,
    AssetPreviewDirective,
    AssetDetailsDirective,
  ],
  exports: [AssetItemsComponent, AssetGroupsComponent, AssetPanelComponent, AssetPreviewDirective],
  providers: [
    provideAsDecorated(ImageAssetPreviewComponent, ImageAssetDetailsComponent),
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => () => {
        store.dispatch([
          new RegisterAssetIcon('file-image', ['png', 'gif', 'jpg', 'jpeg', 'svg']),
          new RegisterAssetTypeLabel('asset.type.image', ['png', 'gif', 'jpg', 'jpeg', 'svg']),
        ]);
      },
      deps: [Store],
      multi: true,
    },
  ],
})
export class AssetModule {}
