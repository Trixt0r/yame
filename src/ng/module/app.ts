import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainComponent } from '../component/main';

//  Modules
import { PixiModule } from './pixi';
import { SidebarModule } from './sidebar';
import { WorkspaceModule } from './workspace';
import { MaterialModule } from './material';
import { ElectronModule } from './electron';
import { UtilsModule } from './utils';

import { PixiService } from './pixi/service';

import { AppComponent } from '../component/app';
import { ToolbarModule } from './toolbar';
import { PluginModule } from './plugin';
import { NgxsModule } from '@ngxs/store';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxsModule.forRoot([]),
    PluginModule,
    UtilsModule,
    ElectronModule,
    PixiModule,
    MaterialModule,
    WorkspaceModule,
    SidebarModule,
    ToolbarModule,
  ],
  declarations: [AppComponent, MainComponent],
  providers: [PixiService],
  bootstrap: [AppComponent],
})
export class AppModule {}
