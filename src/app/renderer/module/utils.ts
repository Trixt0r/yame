import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ResizeableComponent } from './utils/component/resizable';
import { ClearHostDirective } from "./utils/directive/clear-host";

@NgModule({
  imports: [BrowserModule],
  declarations: [
    ResizeableComponent,
    ClearHostDirective
  ],
  exports: [
    ResizeableComponent,
    ClearHostDirective
  ],
})
export class UtilsModule { }
