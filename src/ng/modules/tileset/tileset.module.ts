import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { AssetModule } from '../asset';
import { CameraModule } from '../camera';
import { provideAsDecorated, UtilsModule } from '../utils';
import { TilesetCanvasComponent, TilesetTabComponent } from './components';
import { TilesetState } from './states';

@NgModule({
  imports: [AssetModule, CameraModule, UtilsModule, NgxsModule.forFeature([TilesetState])],
  declarations: [TilesetTabComponent, TilesetCanvasComponent],
  providers: [provideAsDecorated(TilesetTabComponent)],
  exports: [TilesetCanvasComponent],
})
export class TilesetModule {}
