import { NgModule } from '@angular/core';
import { DndModule } from 'ng2-dnd';
import { SceneComponent } from './components';
import { SceneRendererComponentDirective } from './directives/renderer.directive';
import { NoopSceneRendererComponent } from './services/scene.service';
import { ISceneAssetConverter, SceneAssetConverter } from './services/converter.service';
import { SceneComponent as SceneComp, createGroupComponent } from 'common/scene';
import { NgxsModule, Store } from '@ngxs/store';
import { SceneState } from './states/scene.state';
import { ImageAsset } from 'common/asset/image';
import { SelectState } from './states/select.state';
import { createAssetComponent, createColorComponent } from 'common/scene';
import { SceneComponentService } from './services/component.service';
import { HistoryState, UndoHistory, RedoHistory } from './states';
import { HotkeyService } from 'ng/services/hotkey.service';



@SceneAssetConverter('image')
export class ImageAssetConverter implements ISceneAssetConverter<ImageAsset> {
  async execute(asset: ImageAsset): Promise<SceneComp[]> {
    const color = createColorComponent('sprite.color', 'sprite');
    color.red = 255;
    color.green = 255;
    color.blue = 255;
    color.alpha = 1;
    color.label = 'Color';
    const assetComp = createAssetComponent('sprite.texture', asset.id, 'sprite');
    assetComp.allowedTypes = ['image'];
    assetComp.label = 'Texture';
    const sprite = createGroupComponent('sprite', ['sprite.texture', 'sprite.color']);
    sprite.label = 'Sprite';
    sprite.allowedMemberTypes = [];
    sprite.allowedMemberItems = [];
    return [ sprite, assetComp, color ];
  }
}

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
  entryComponents: [
    NoopSceneRendererComponent,
  ],
  exports: [
    SceneComponent
  ]
})
export class SceneModule {

  constructor(components: SceneComponentService, store: Store, hotkeys: HotkeyService) {
    // Reserve specific component ids
    components.reserveId('transformation');
    components.reserveId('transformation.position');
    components.reserveId('transformation.rotation');
    components.reserveId('transformation.scale');
    components.reserveId('sprite');
    components.reserveId('sprite.texture');
    components.reserveId('sprite.color');

    hotkeys.register({ keys: ['control.z', 'meta.z'] })
            .subscribe(() => store.dispatch(new UndoHistory()));
    hotkeys.register({ keys: ['control.y', 'meta.y', 'meta.shift.z'] })
            .subscribe(() => store.dispatch(new RedoHistory()));
  }

}
