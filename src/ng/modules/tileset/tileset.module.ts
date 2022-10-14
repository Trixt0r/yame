import { APP_INITIALIZER, NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { AddToolService, AssetModule } from '../asset';
import { CameraModule } from '../camera';
import { EngineService } from '../scene';
import { ToolInterceptor } from '../toolbar/interceptor';
import { provideAsDecorated, UtilsModule } from '../utils';
import { TilesetCanvasComponent, TilesetTabComponent } from './components';
import { TileBrushInterceptor } from './interceptors';
import { TilesetState } from './states';
import { TilesetSystem } from './systems';

@NgModule({
  imports: [AssetModule, CameraModule, UtilsModule, NgxsModule.forFeature([TilesetState])],
  declarations: [TilesetTabComponent, TilesetCanvasComponent],
  providers: [
    provideAsDecorated(TilesetTabComponent),
    ToolInterceptor.forTool(AddToolService, TileBrushInterceptor),
    {
      provide: APP_INITIALIZER,
      useFactory: (engineService: EngineService, tilesetSystem: TilesetSystem) => () => {
        engineService.engine.systems.add(tilesetSystem);
      },
      deps: [EngineService, TilesetSystem],
      multi: true,
    },
  ],
  exports: [TilesetCanvasComponent],
})
export class TilesetModule {}
