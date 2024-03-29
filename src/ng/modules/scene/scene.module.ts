import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { SceneComponent } from './components/scene/scene.component';
import { SceneRendererComponentDirective } from './directives/renderer.directive';
import { NoopSceneRendererComponent } from './services/scene.service';
import { NgxsModule } from '@ngxs/store';
import { SceneState } from './states/scene.state';
import { SelectState } from './states/select.state';
import { SceneComponentService } from './services/component.service';
import { HistoryState } from './states/history.state';
import { ImageAssetService } from './services/image-asset.service';
import { decorateComponentIOInstances, decorateConverterInstances } from './decorators';

@NgModule({
  imports: [NgxsModule.forFeature([SceneState, HistoryState, SelectState])],

  declarations: [SceneComponent, SceneRendererComponentDirective, NoopSceneRendererComponent],
  exports: [SceneComponent],
  providers: [
    ImageAssetService,
    {
      provide: APP_INITIALIZER,
      useFactory: (components: SceneComponentService, injector: Injector) => () => {
        // Reserve specific component ids
        components.reserveId('transformation');
        components.reserveId('transformation.position');
        components.reserveId('transformation.rotation');
        components.reserveId('transformation.scale');
        components.reserveId('sprite');
        components.reserveId('sprite.texture');
        components.reserveId('sprite.color');

        // Make sure decorated class instance are actually registered
        decorateConverterInstances(injector);
        decorateComponentIOInstances(injector);
      },
      deps: [SceneComponentService, Injector],
      multi: true,
    },
  ],
})
export class SceneModule {}
