import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SidebarComponent } from './sidebar/component';
import { UtilsModule } from "./utils";

@NgModule({
  imports: [BrowserModule, UtilsModule],
  declarations: [
    SidebarComponent
  ],
  exports: [
    SidebarComponent
  ],
})
export class SidebarModule { }