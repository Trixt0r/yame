import { PixiService } from './pixi/service';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { PixiComponent } from './pixi/component';

@NgModule({
  imports: [BrowserModule],
  exports: [PixiComponent],
  declarations: [
    PixiComponent,
  ],
  providers: [PixiService]
})
export class PixiModule { }