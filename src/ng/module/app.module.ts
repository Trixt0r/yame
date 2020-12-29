import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainComponent } from '../component/main';

// Modules
import { SidebarModule } from './sidebar/sidebar.module';
import { MaterialModule } from './material.module';
import { ElectronModule } from './electron/electron.module';
import { UtilsModule } from './utils';

import { AppComponent } from '../component/app';
import { PluginModule } from './plugin/plugin.module';
import { NgxsModule } from '@ngxs/store';
import { SceneModule } from './scene';
import { PixiModule } from './pixi/pixi.module';
import { ToolbarModule } from './toolbar/toolbar.module';
import { CursorService } from 'ng/services/cursor.service';
import { HotkeyState } from 'ng/states/hotkey.state';
import { AssetModule } from './asset/asset.module';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxsModule.forRoot([HotkeyState]),
    MaterialModule,
    UtilsModule,
    SceneModule,
    PluginModule,
    ElectronModule,
    AssetModule,
    SidebarModule,
    ToolbarModule,
    PixiModule,
  ],
  declarations: [AppComponent, MainComponent],
  providers: [CursorService],
  bootstrap: [AppComponent],
})
export class AppModule {
}
