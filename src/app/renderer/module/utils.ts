import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ResizeableComponent } from './utils/component/resizable';

@NgModule({
  imports: [BrowserModule],
  declarations: [
    ResizeableComponent
  ],
  exports: [
    ResizeableComponent
  ],
})
export class UtilsModule { }