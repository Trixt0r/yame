import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { SidebarComponent } from './components/sidebar.component';
import { ColorPickerModule } from '@iplab/ngx-color-picker';
import { UtilsModule } from '../utils';
import { HierarchyComponent } from './components/hierarchy/hierarchy.component';
import { SelectionComponent } from './components/selection/selection.component';
import { NgRoundPipeModule } from 'angular-pipes';
import { SceneComponentsService } from './services/scene-components.service';
import { EntityComponentsDirective } from './directives/entity-components.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GroupTypeComponent } from './components/selection/types/group/group.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DndModule } from 'ng2-dnd';
import { MatSelectModule } from '@angular/material/select';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AddSceneComponentButtonComponent } from './components/selection/add/add.component';
import {
  createPointComponent,
  createColorComponent,
  createAssetComponent,
  SceneEntity,
  createTransformationComponents,
  SceneEntityType,
} from 'common/scene';
import { MatDialogModule } from '@angular/material/dialog';
import { EditComponentComponent, EditComponentDialogComponent } from './components/selection/edit/edit.component';
import { SceneComponentService } from 'ng/modules/scene';
import { AddEntityComponent } from './components/hierarchy/add/add.component';
import { EntityTypeService } from './services/entity-type.service';
import { createSizeComponent } from 'common/scene/component/size';
import { SizeTypeComponent } from './components/selection/types/size/size.component';
import { NumberTypeComponent } from './components/selection/types/number/number.component';
import { AssetTypeComponent } from './components/selection/types/asset/asset.component';
import { ColorTypeComponent } from './components/selection/types/color/color.component';
import { InputTypeComponent } from './components/selection/types/input/input.component';
import { PointTypeComponent } from './components/selection/types/point/point.component';
import { RangeTypeComponent } from './components/selection/types/range/range.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    NgRoundPipeModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    ColorPickerModule,
    NgSelectModule,
    DndModule,
    MatSelectModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatExpansionModule,
    MatSliderModule,
    MatInputModule,
    MatButtonModule,
    ScrollingModule,
    NzTreeModule,
    NzButtonModule,
    NzDropDownModule,
    NzIconModule,
  ],
  declarations: [
    SidebarComponent,
    HierarchyComponent,
    EntityComponentsDirective,
    SelectionComponent,
    InputTypeComponent,
    NumberTypeComponent,
    ColorTypeComponent,
    RangeTypeComponent,
    PointTypeComponent,
    SizeTypeComponent,
    GroupTypeComponent,
    AssetTypeComponent,
    AddSceneComponentButtonComponent,
    AddEntityComponent,
    EditComponentComponent,
    EditComponentDialogComponent,
  ],
  exports: [
    SidebarComponent,
    HierarchyComponent,
    EntityComponentsDirective,
    SelectionComponent,
    SizeTypeComponent,
    NumberTypeComponent,
    ColorTypeComponent,
    RangeTypeComponent,
    PointTypeComponent,
    SizeTypeComponent,
    GroupTypeComponent,
    AssetTypeComponent,
  ],
})
export class SidebarModule {
  constructor(components: SceneComponentsService, entityTypes: EntityTypeService, compService: SceneComponentService) {
    components.registerCategory({
      id: 'general',
      items: ['general.string', 'general.number', 'general.point', 'general.size', 'general.color', 'general.range'],
      label: 'componentLabel.general',
      icon: 'more',
    });

    components.registerCategory({
      id: 'asset',
      items: ['asset.any', 'asset.texture', 'asset.sound', 'asset.music'],
      label: 'componentLabel.asset',
      icon: 'inbox',
    });

    components.registerItem({ id: 'group', type: 'group', icon: 'group', label: 'componentLabel.group' });
    components.registerItem({
      id: 'general.string',
      type: 'string',
      icon: 'font-size',
      label: 'componentLabel.string',
    });
    components.registerItem({
      id: 'general.number',
      type: 'number',
      icon: 'field-number',
      label: 'componentLabel.number',
    });
    components.registerItem({
      id: 'general.range',
      type: 'range',
      icon: 'line',
      label: 'componentLabel.range',
    });
    components.registerItem({
      id: 'general.point',
      type: 'point',
      icon: 'close-circle',
      label: 'componentLabel.transformation.position',
      factory: (entities, type, group) => createPointComponent(compService.generateComponentId(entities, type), 0, 0),
    });
    components.registerItem({
      id: 'general.size',
      type: 'size',
      icon: 'fullscreen',
      label: 'componentLabel.transformation.size',
      factory: (entities, type, group) => createSizeComponent(compService.generateComponentId(entities, type), 0, 0),
    });

    components.registerItem({
      id: 'general.color',
      type: 'color',
      icon: 'bg-colors',
      label: 'componentLabel.sprite.color',
      factory: (entities, type, group) => createColorComponent(compService.generateComponentId(entities, type)),
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
      factory: (entities, type, group) => {
        const component = createAssetComponent(compService.generateComponentId(entities, type));
        component.allowedTypes = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
        return component;
      },
    });

    components.registerTypeComponent(InputTypeComponent);
    components.registerTypeComponent(AssetTypeComponent);
    components.registerTypeComponent(NumberTypeComponent as any);
    components.registerTypeComponent(ColorTypeComponent as any);
    components.registerTypeComponent(RangeTypeComponent as any);
    components.registerTypeComponent(PointTypeComponent as any);
    components.registerTypeComponent(SizeTypeComponent as any);
    components.registerTypeComponent(GroupTypeComponent as any);

    entityTypes.registerItem({
      id: 'entity',
      type: 'entity',
      label: 'entityLabel.entity',
      icon: 'border',
      factory: (id, parent) => {
        const entity = new SceneEntity();
        const comps = createTransformationComponents();
        entity.components.add.apply(entity.components, comps);
        return entity;
      },
    });

    entityTypes.registerItem({
      id: 'group',
      type: 'group',
      label: 'entityLabel.group',
      icon: 'folder',
      factory: (id, parent) => {
        const entity = new SceneEntity();
        entity.type = SceneEntityType.Group;
        const comps = createTransformationComponents();
        entity.components.add.apply(entity.components, comps);
        return entity;
      },
    });

    entityTypes.registerItem({
      id: 'layer',
      type: 'layer',
      label: 'entityLabel.layer',
      icon: 'fa:layer',
      factory: (id, parent) => {
        const entity = new SceneEntity();
        entity.type = SceneEntityType.Layer;
        return entity;
      },
    });
  }
}
