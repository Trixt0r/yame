import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UtilsModule } from '../utils';
import { DndModule } from 'ng2-dnd';
import { AssetPreviewDirective } from './directives/preview.directive';
import { AssetDefaultPreviewComponent } from './components/previews/default/default.component';
import { NgxsModule, Store } from '@ngxs/store';
import { NgMathPipesModule } from 'ngx-pipes';
import { RegisterAssetIcon, RegisterAssetTypeLabel } from './states/actions/asset.action';
import { AssetState } from './states/asset.state';
import {
  AssetTreeComponent,
  AssetTypeComponent,
  AssetImagePreviewComponent,
  AssetAddSourceComponent,
  AssetExplorerComponent,
  AssetInspectorComponent,
  AssetDetailsTabComponent,
} from './components';
import { AssetDimensionsDetailsComponent } from './components/details/dimensions/dimensions.component';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { SceneComponentsService } from '../sidebar/services/scene-components.service';
import { createAssetComponent } from 'common/scene';
import { SceneComponentService } from '../scene';
import { RegisterTool } from '../toolbar/states/actions/toolbar.action';
import { AddToolService } from './tools/add.tool';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { AssetTabDirective } from './directives';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
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
    NgMathPipesModule,
    NzSpinModule,
    NzSelectModule,
    NzToolTipModule,
    NzDescriptionsModule,
    NzTypographyModule,
    DndModule.forRoot(),
    NgxsModule.forFeature([AssetState]),
  ],
  declarations: [
    AssetTreeComponent,
    AssetDefaultPreviewComponent,
    AssetImagePreviewComponent,
    AssetDimensionsDetailsComponent,
    AssetPreviewDirective,
    AssetTabDirective,
    AssetTypeComponent,
    AssetAddSourceComponent,
    AssetExplorerComponent,
    AssetInspectorComponent,
    AssetDetailsTabComponent,
  ],
  exports: [AssetPreviewDirective],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, addTool: AddToolService) => () => {
        store.dispatch([
          new RegisterAssetIcon('file-image', ['png', 'gif', 'jpg', 'jpeg', 'svg']),
          new RegisterAssetTypeLabel('asset.type.image', ['png', 'gif', 'jpg', 'jpeg', 'svg']),
          new RegisterTool(addTool),
        ]);
      },
      deps: [Store, AddToolService],
      multi: true,
    },
  ],
})
export class AssetModule {
  constructor(components: SceneComponentsService, compService: SceneComponentService) {
    components.registerCategory({
      id: 'asset',
      items: ['asset.any', 'asset.texture', 'asset.sound', 'asset.music'],
      label: 'componentLabel.asset',
      icon: 'inbox',
    });

    components.registerItem({
      id: 'asset.any',
      type: 'asset',
      icon: 'file-unknown',
      label: 'componentLabel.anyAsset',
    });

    components.registerItem({
      id: 'asset.texture',
      type: 'asset',
      icon: 'file-image',
      label: 'componentLabel.texture',
      factory: (entities, type, _group) => {
        const component = createAssetComponent(compService.generateComponentId(entities, type));
        component.allowedTypes = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
        return component;
      },
    });

    components.registerTypeComponent(AssetTypeComponent);
  }
}
