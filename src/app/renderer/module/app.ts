import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainComponent } from '../component/main';

//  Modules
import { PixiModule } from './pixi';
import { SidebarModule } from './sidebar';
import { WorkspaceModule } from './workspace';
import { MaterialModule } from './material';
import { UtilsModule } from "./utils";

import { PixiService } from './pixi/service';
import { WorkspaceService } from './workspace/service';

import { AppComponent } from '../component/app';

@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule, UtilsModule, PixiModule, MaterialModule, WorkspaceModule, SidebarModule],
  declarations: [
    AppComponent,
    MainComponent,
  ],
  providers: [PixiService, WorkspaceService],
  bootstrap: [AppComponent],
})
export class AppModule { }