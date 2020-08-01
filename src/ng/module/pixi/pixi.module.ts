import { NgModule, APP_INITIALIZER } from '@angular/core';
import { YAME_RENDERER, YAME_RENDERER_COMPONENT } from '../scene';
import { PixiRendererService, PixiRendererComponent } from './services/renderer.service';
import { PixiGridDirective } from './directive/grid';
import {
  PixiSelectionService,
  PixiSelectionContainerService,
  PixiSelectionRendererService,
} from './services';

import { PixiSelectionHandlerPositionService } from './services/selection/handlers/position.service';
import { PixiSelectionHandlerRotationService } from './services/selection/handlers/rotation.service';
import { PixiSelectionHandlerSkewService } from './services/selection/handlers/skew.service';
import { PixiSelectionHandlerResizeService } from './services/selection/handlers/resize.service';
import { PixiSelectionHandlerPivotService } from './services/selection/handlers/pivot.service';

@NgModule({
  declarations: [PixiGridDirective, PixiRendererComponent],
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
      useFactory: () => () => {},
      deps: [
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
