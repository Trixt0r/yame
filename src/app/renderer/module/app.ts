import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from '../component/app';
import { PixiComponent } from '../component/pixi';
import { SidebarComponent } from '../component/sidebar';
import { ResizableModule } from 'angular-resizable-element';

@NgModule({
  imports: [BrowserModule, ResizableModule],
  declarations: [
    AppComponent,
    PixiComponent,
    SidebarComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}