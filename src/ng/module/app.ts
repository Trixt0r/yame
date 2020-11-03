import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainComponent } from '../component/main';

// Modules
import { SidebarModule } from './sidebar/sidebar.module';
import { WorkspaceModule } from './workspace';
import { MaterialModule } from './material';
import { ElectronModule } from './electron';
import { UtilsModule } from './utils';

import { AppComponent } from '../component/app';
import { PluginModule } from './plugin';
import { NgxsModule } from '@ngxs/store';
import { SceneModule } from './scene';
import { PixiModule } from './pixi/pixi.module';
import { ToolbarModule } from './toolbar/toolbar.module';
import { CursorService } from 'ng/services/cursor.service';
import { HotkeyState } from 'ng/states/hotkey.state';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxsModule.forRoot([HotkeyState]),
    PluginModule,
    UtilsModule,
    ElectronModule,
    PixiModule,
    SceneModule,
    MaterialModule,
    WorkspaceModule,
    SidebarModule,
    ToolbarModule,
  ],
  declarations: [AppComponent, MainComponent],
  providers: [CursorService],
  bootstrap: [AppComponent],
})
export class AppModule {
}
