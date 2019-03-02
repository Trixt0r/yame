import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ResizeableComponent } from './utils/component/resizable';
import { ColorPipe } from './utils/pipe/color';

@NgModule({
  imports: [BrowserModule],
  declarations: [ResizeableComponent, ColorPipe],
  exports: [ResizeableComponent, ColorPipe],
})
export class UtilsModule {}
