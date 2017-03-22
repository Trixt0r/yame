import { PixiService } from './pixi/service';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { PixiModule } from './pixi';

import { AppComponent } from '../component/app';
import { SidebarComponent } from '../component/sidebar';

@NgModule({
  imports: [BrowserModule, PixiModule],
  declarations: [
    AppComponent,
    SidebarComponent,
  ],
  providers: [PixiService],
  bootstrap: [AppComponent],
})
export class AppModule {}