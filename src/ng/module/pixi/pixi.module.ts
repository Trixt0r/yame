import { NgModule, APP_INITIALIZER, Inject } from '@angular/core';
import { YAME_RENDERER, YAME_RENDERER_COMPONENT, EngineService } from '../scene';
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
import {
  PixiGridSystem,
  PixiCameraSystem,
  PixiTransformationSystem,
  PixiRenderingSystem,
  PixiDebugSystem,
  PixiSpriteSystem,
  PixiForegroundSystem,
  PixiBackdropSystem,
} from './systems';
import { Store } from '@ngxs/store';
import { AddShortcut } from 'ng/states/hotkey.state';

/**
 * Sets up all necessary systems for rendering entities in the scene.
 *
 * @param renderer The pixi renderer service.
 * @param engineService The engine service.
 */
export function setupSystems(renderer: PixiRendererService, engineService: EngineService, store: Store): () => void {
  return () => {
    engineService.engine.systems.add(new PixiGridSystem(renderer, 0));
    engineService.engine.systems.add(new PixiCameraSystem(renderer, 1));
    engineService.engine.systems.add(new PixiSpriteSystem(renderer, 2));
    engineService.engine.systems.add(new PixiBackdropSystem(renderer, 3));
    engineService.engine.systems.add(new PixiTransformationSystem(renderer, 10));
    engineService.engine.systems.add(new PixiRenderingSystem(renderer, 100));
    engineService.engine.systems.add(new PixiForegroundSystem(renderer, 999));
    engineService.engine.systems.add(new PixiDebugSystem(renderer, 9999));

    engineService.engine.addListener({
      onErrorBySystem: (error, system) => {
        console.error(error, system);
      }
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
        keys: ['control.arrowleft', 'control.arrowright', 'control.arrowup', 'control.arrowdown'],
      }),
      new AddShortcut({
        id: 'selection.rotate',
        label: 'Rotate selection',
        keys: ['shift.arrowleft', 'shift.arrowright', 'shift.arrowup', 'shift.arrowdown'],
      }),
      new AddShortcut({
        id: 'selection.skew',
        label: 'Skew selection',
        keys: ['control.shift.arrowleft', 'control.shift.arrowright', 'control.shift.arrowup', 'control.shift.arrowdown'],
      }),
      new AddShortcut({
        id: 'selection.pivot',
        label: 'Pivot selection',
        keys: ['alt.arrowleft', 'alt.arrowright', 'alt.arrowup', 'alt.arrowdown'],
      })
    ]);
  };
}

@NgModule({
  declarations: [PixiRendererComponent],
  entryComponents: [PixiRendererComponent],
  providers: [
    {
      provide: YAME_RENDERER,
      useClass: PixiRendererService,
    },
    {
      provide: YAME_RENDERER_COMPONENT,
      useValue: PixiRendererComponent,
    },
    PixiSelectionService,
    PixiSelectionContainerService,
    PixiSelectionRendererService,
    PixiSelectionHandlerPositionService,
    {
      provide: APP_INITIALIZER,
      useFactory: setupSystems,
      deps: [
        YAME_RENDERER,
        EngineService,
        Store,
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
