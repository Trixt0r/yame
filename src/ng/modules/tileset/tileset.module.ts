import { NgModule } from '@angular/core';
import { AssetModule } from '../asset';
import { CameraModule } from '../camera';
import { provideAsDecorated, UtilsModule } from '../utils';
import { TilesetCanvasComponent, TilesetTabComponent } from './components';

@NgModule({
  imports: [AssetModule, CameraModule, UtilsModule],
  declarations: [TilesetTabComponent, TilesetCanvasComponent],
  providers: [provideAsDecorated(TilesetTabComponent)],
  exports: [TilesetCanvasComponent],
})
export class TilesetModule {}
