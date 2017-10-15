
import '../style.scss';
import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import '../polyfills';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainComponent } from '../component/main';

//  Modules
import { PixiModule } from './pixi';
import { SidebarModule } from './sidebar';
import { WorkspaceModule } from './workspace';
import { MaterialModule } from './material';
import { ElectronModule } from "./electron";
import { UtilsModule } from "./utils";

import { ElectronService } from './electron/service';
import { PixiService } from './pixi/service';
import { WorkspaceService } from './workspace/service';

import { AppComponent } from '../component/app';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    UtilsModule,
    ElectronModule,
    PixiModule,
    MaterialModule,
    WorkspaceModule,
    SidebarModule
  ],
  declarations: [
    AppComponent,
    MainComponent,
  ],
  providers: [PixiService],
  bootstrap: [AppComponent],
})
export class AppModule { }
