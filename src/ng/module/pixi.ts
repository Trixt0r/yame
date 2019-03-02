import { PixiCameraDirective } from './pixi/directive/camera';
import { PixiGridDirective } from './pixi/directive/grid';
import { PixiService } from './pixi/service';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxsModule } from '@ngxs/store';

import { PixiComponent } from './pixi/component';
import { DndModule } from 'ng2-dnd';

import imageConverter from './pixi/service/converter/image';
import { SceneState } from './pixi/ngxs/state';

@NgModule({
  imports: [BrowserModule, DndModule.forRoot(), NgxsModule.forFeature([SceneState])],
  exports: [PixiCameraDirective, PixiGridDirective, PixiComponent],
  declarations: [PixiCameraDirective, PixiGridDirective, PixiComponent],
  providers: [PixiService],
})
export class PixiModule {
  constructor(service: PixiService) {
    service.assetConverter.register('image', imageConverter);
  }
}
