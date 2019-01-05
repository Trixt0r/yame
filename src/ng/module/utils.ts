import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ResizeableComponent } from './utils/component/resizable';
import { ClearHostDirective } from './utils/directive/clear-host';
import { ColorPipe } from './utils/pipe/color';

@NgModule({
  imports: [BrowserModule],
  declarations: [
    ResizeableComponent,
    ClearHostDirective,
    ColorPipe,
  ],
  exports: [
    ResizeableComponent,
    ClearHostDirective,
    ColorPipe,
  ],
})
export class UtilsModule {}
