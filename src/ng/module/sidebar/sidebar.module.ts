import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { SidebarComponent } from './components/sidebar.component';
import { ColorPickerModule } from '@iplab/ngx-color-picker';
import { UtilsModule } from '../utils';
import { MaterialModule } from '../material.module';
import { HierarchyComponent } from './components/hierarchy/hierarchy.component';
import { SelectionComponent } from './components/selection/selection.component';
import { NgMathPipesModule } from 'angular-pipes';
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
import { SceneComponentService } from 'ng/module/scene';
import { AddEntityComponent } from './components/hierarchy/add/add.component';
import { EntityTypeService } from './services/entity-type.service';
import { TreeModule } from 'angular-tree-component';
import { createSizeComponent } from 'common/scene/component/size';
import { SizeTypeComponent } from './components/selection/types/size/size.component';
import { NumberTypeComponent } from './components/selection/types/number/number.component';
import { AssetTypeComponent } from './components/selection/types/asset/asset.component';
import { ColorTypeComponent } from './components/selection/types/color/color.component';
import { InputTypeComponent } from './components/selection/types/input/input.component';
import { PointTypeComponent } from './components/selection/types/point/point.component';
import { RangeTypeComponent } from './components/selection/types/range/range.component';

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    MaterialModule,
    NgMathPipesModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    ColorPickerModule,
    NgSelectModule,
    DndModule,
    MatSelectModule,
    MatDialogModule,
    ScrollingModule,
    TreeModule.forRoot(),
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
      label: 'General',
      icon: 'adjust',
    });

    components.registerCategory({
      id: 'asset',
      items: ['asset.any', 'asset.texture', 'asset.sound', 'asset.music'],
      label: 'Asset',
      icon: 'attach_file',
    });

    components.registerItem({ id: 'group', type: 'group', icon: 'filter_none' });
    components.registerItem({ id: 'general.string', type: 'string', icon: 'text_fields' });
    components.registerItem({ id: 'general.number', type: 'number', icon: 'short_text' });
    components.registerItem({ id: 'general.range', type: 'range', icon: 'linear_scale' });
    components.registerItem({
      id: 'general.point',
      type: 'point',
      icon: 'location_on',
      factory: (entities, type, group) => createPointComponent(compService.generateComponentId(entities, type), 0, 0),
    });
    components.registerItem({
      id: 'general.size',
      type: 'size',
      icon: 'open_in_full',
      factory: (entities, type, group) => createSizeComponent(compService.generateComponentId(entities, type), 0, 0),
    });

    components.registerItem({
      id: 'general.color',
      type: 'color',
      icon: 'palette',
      factory: (entities, type, group) => createColorComponent(compService.generateComponentId(entities, type)),
    });

    components.registerItem({
      id: 'asset.any',
      type: 'asset',
      icon: 'insert_drive_file',
    });

    components.registerItem({
      id: 'asset.texture',
      type: 'asset',
      icon: 'image',
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
      label: 'Entity',
      icon: 'insert_drive_file',
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
      label: 'Group',
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
      label: 'Layer',
      icon: 'layers',
      factory: (id, parent) => {
        const entity = new SceneEntity();
        entity.type = SceneEntityType.Layer;
        return entity;
      },
    });
  }
}
