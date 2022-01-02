import { NgModule } from '@angular/core';
import { AssetModule } from '../asset';
import { provideAsDecorated } from '../utils';
import { TileMapTabComponent } from './components';

@NgModule({
  imports: [AssetModule],
  declarations: [TileMapTabComponent],
  providers: [provideAsDecorated(TileMapTabComponent)],
  // exports: [TileMapTabComponent],
})
export class TileMapModule {
  constructor() {
    console.log('TileMapModule');
  }
}
