import { Actions, Store } from '@ngxs/store';
import { NgModule, APP_INITIALIZER, Inject } from '@angular/core';
import { YAME_RENDERER, YAME_RENDERER_COMPONENT, EngineService, SceneModule } from 'ng/modules/scene';
import { PixiRendererService } from './services/renderer.service';
import { PixiRendererComponent } from './components/renderer.component';
import { PixiSelectionService } from './services/selection.service';
import { PixiSelectionContainerService } from './services/selection/container.service';
import { PixiSelectionRendererService } from './services/selection/renderer.service';
import { PixiSelectionHandlerPositionService } from './services/selection/handlers/position.service';
import { PixiSelectionHandlerRotationService } from './services/selection/handlers/rotation.service';
import { PixiSelectionHandlerSkewService } from './services/selection/handlers/skew.service';
import { PixiSelectionHandlerResizeService } from './services/selection/handlers/resize.service';
import { PixiSelectionHandlerPivotService } from './services/selection/handlers/pivot.service';
import { PixiGridSystem } from './systems/grid.system';
import { PixiCameraSystem } from './systems/camera.system';
import { PixiSpriteSystem } from './systems/sprite.system';
import { PixiBackdropSystem } from './systems/backdrop.system';
import { PixiDebugSystem } from './systems/debug.system';
import { PixiForegroundSystem } from './systems/foreground.system';
import { PixiRenderingSystem } from './systems/rendering.system';
import { PixiTransformationSystem } from './systems/transformation.system';
import { AddShortcut } from 'ng/states/hotkey.state';
import { HotkeyService } from 'ng/services/hotkey.service';
import { SCALE_MODES, settings } from 'pixi.js';
import { CameraModule } from '../camera/camera.module';

settings.SCALE_MODE = SCALE_MODES.NEAREST;

/**
 * Sets up all necessary systems for rendering entities in the scene.
 *
 * @param renderer The pixi renderer service.
 * @param engineService The engine service.
 */
export function setupSystems(
  renderer: PixiRendererService,
  engineService: EngineService,
  store: Store,
  actions: Actions
): () => void {
  return () => {
    engineService.engine.systems.add(new PixiGridSystem(renderer, 0));
    engineService.engine.systems.add(new PixiCameraSystem(renderer, actions, store, 1));
    engineService.engine.systems.add(new PixiSpriteSystem(renderer, 2));
    engineService.engine.systems.add(new PixiBackdropSystem(renderer, 3));
    engineService.engine.systems.add(new PixiTransformationSystem(renderer, 10));
    engineService.engine.systems.add(new PixiRenderingSystem(renderer, 100));
    engineService.engine.systems.add(new PixiForegroundSystem(renderer, 999));
    engineService.engine.systems.add(new PixiDebugSystem(renderer, 9999));

    engineService.engine.addListener({
      onErrorBySystem: (error, system) => {
        console.error(error, system);
      },
    });

    store.dispatch([
      new AddShortcut({
        id: 'selection.move',
        label: 'Move selection',
        keys: ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'],
      }),
      new AddShortcut({
        id: 'selection.resize',
        label: 'Resize selection',
        keys: [
          `${HotkeyService.commandOrControl}.arrowleft`,
          `${HotkeyService.commandOrControl}.arrowright`,
          `${HotkeyService.commandOrControl}.arrowup`,
          `${HotkeyService.commandOrControl}.arrowdown`,
        ],
      }),
      new AddShortcut({
        id: 'selection.rotate',
        label: 'Rotate selection',
        keys: ['shift.arrowleft', 'shift.arrowright', 'shift.arrowup', 'shift.arrowdown'],
      }),
      new AddShortcut({
        id: 'selection.skew',
        label: 'Skew selection',
        keys: [
          `${HotkeyService.commandOrControl}.shift.arrowleft`,
          `${HotkeyService.commandOrControl}.shift.arrowright`,
          `${HotkeyService.commandOrControl}.shift.arrowup`,
          `${HotkeyService.commandOrControl}.shift.arrowdown`,
        ],
      }),
      new AddShortcut({
        id: 'selection.pivot',
        label: 'Pivot selection',
        keys: ['alt.arrowleft', 'alt.arrowright', 'alt.arrowup', 'alt.arrowdown'],
      }),
      new AddShortcut({
        id: 'camera.move',
        label: 'Move camera',
        keys: ['space'],
      }),
    ]);
  };
}

@NgModule({
  declarations: [PixiRendererComponent],
  imports: [SceneModule, CameraModule],
  providers: [
    {
      provide: YAME_RENDERER,
      useClass: PixiRendererService,
    },
    {
      provide: YAME_RENDERER_COMPONENT,
      useValue: PixiRendererComponent,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: setupSystems,
      deps: [
        YAME_RENDERER,
        EngineService,
        Store,
        Actions,
        PixiSelectionService,
        PixiSelectionContainerService,
        PixiSelectionRendererService,
        PixiSelectionHandlerPositionService,
        PixiSelectionHandlerRotationService,
        PixiSelectionHandlerSkewService,
        PixiSelectionHandlerResizeService,
        PixiSelectionHandlerPivotService,
      ],
      multi: true,
    },
  ],
})
export class PixiModule {}
