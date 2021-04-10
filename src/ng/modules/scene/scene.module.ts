import { APP_INITIALIZER, NgModule } from '@angular/core';
import { DndModule } from 'ng2-dnd';
import { SceneComponent } from './components/scene/scene.component';
import { SceneRendererComponentDirective } from './directives/renderer.directive';
import { NoopSceneRendererComponent, SceneService } from './services/scene.service';
import { ISceneAssetConverter, SceneAssetConverter } from './services/converter.service';
import { SceneComponent as SceneComp, createGroupComponent, SceneEntityData } from 'common/scene';
import { NgxsModule, Store } from '@ngxs/store';
import { SceneState } from './states/scene.state';
import { SelectState } from './states/select.state';
import { createAssetComponent, createColorComponent } from 'common/scene';
import { SceneComponentService } from './services/component.service';
import { HistoryState } from './states/history.state';
import { Asset } from 'common/asset';
import { registerIO } from 'common/scene/component.io';
import { AddEditorFileProcessor } from 'ng/states/actions/editor.action';
import { ResetScene } from './states/actions/scene.action';
import { CreateEntity } from './states/actions/entity.action';
import { IFileState } from 'ng/states/editor.state';


registerIO({
  id: 'sprite.texture',
  async serialize(comp, entity) { return null; },

  async deserialize(data, entity) {
    return { allowedTypes: ['png', 'jpg', 'jpeg', 'gif', 'svg'] };
  }
})
export class ImageAssetConverter implements ISceneAssetConverter {
  async execute(asset: Asset): Promise<SceneComp[]> {
    const color = createColorComponent('sprite.color', 'sprite');
    color.red = 255;
    color.green = 255;
    color.blue = 255;
    color.alpha = 1;
    const assetComp = createAssetComponent('sprite.texture', asset.id, 'sprite');
    assetComp.allowedTypes = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
    const sprite = createGroupComponent('sprite', ['sprite.texture', 'sprite.color']);
    sprite.allowedMemberTypes = [];
    sprite.allowedMemberItems = [];
    return [ sprite, assetComp, color ];
  }
}
SceneAssetConverter(['png', 'jpg', 'jpeg', 'gif'])(ImageAssetConverter);

@NgModule({

  imports: [
    DndModule.forRoot(),
    NgxsModule.forFeature([SceneState, HistoryState, SelectState])
  ],

  declarations: [
    SceneComponent,
    SceneRendererComponentDirective,
    NoopSceneRendererComponent,
  ],
  // entryComponents: [
  //   NoopSceneRendererComponent,
  // ],
  exports: [
    SceneComponent
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, scene: SceneService) => () => {
        store.dispatch(new AddEditorFileProcessor({
          key: 'entities',
          async serialize(fileState, context) {
            return scene.export(context);
          },
          async deserialize(fileState: IFileState< { entities: SceneEntityData[] }>, context) {
            const entities = await scene.import(fileState.data!.entities, context);
            await store.dispatch(new ResetScene()).toPromise();
            await store.dispatch(new CreateEntity(entities));
            return entities;
          }
        }));
      },
      deps: [ Store, SceneService ],
      multi: true,
    }
  ]
})
export class SceneModule {

  constructor(components: SceneComponentService) {
    // Reserve specific component ids
    components.reserveId('transformation');
    components.reserveId('transformation.position');
    components.reserveId('transformation.rotation');
    components.reserveId('transformation.scale');
    components.reserveId('sprite');
    components.reserveId('sprite.texture');
    components.reserveId('sprite.color');
  }

}
