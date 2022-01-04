import { NgModule } from '@angular/core';
import { AssetModule } from '../asset';
import { provideAsDecorated, UtilsModule } from '../utils';
import { TilesetCanvasComponent, TilesetTabComponent } from './components';

@NgModule({
  imports: [AssetModule, UtilsModule],
  declarations: [TilesetTabComponent, TilesetCanvasComponent],
  providers: [provideAsDecorated(TilesetTabComponent)],
  exports: [TilesetCanvasComponent],
})
export class TilesetModule {}
