import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainComponent } from './components/main/main.component';

// Modules
import { SidebarModule } from './modules/sidebar/sidebar.module';
import { ElectronModule } from './modules/electron/electron.module';
import { UtilsModule } from './modules/utils';

import { AppComponent } from './components/app/app.component';
import { PluginModule } from './modules/plugin/plugin.module';
import { NgxsModule } from '@ngxs/store';
import { SceneModule } from './modules/scene';
import { PixiModule } from './modules/pixi/pixi.module';
import { ToolbarModule } from './modules/toolbar/toolbar.module';
import { HotkeyState } from 'ng/states/hotkey.state';
import { AssetModule } from './modules/asset/asset.module';
import { CameraModule } from './modules/camera/camera.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { EditorState } from './states/editor.state';
import { NgxsOnBeforePluginModule } from './modules/onbefore-plugin/onbefore-plugin.module';
import { TilesetModule } from './modules/tileset';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxsModule.forRoot([EditorState, HotkeyState]),
    NgxsOnBeforePluginModule.forRoot(),
    UtilsModule,
    SceneModule,
    PluginModule,
    ElectronModule,
    AssetModule,
    SidebarModule,
    ToolbarModule,
    PreferencesModule,
    CameraModule,
    PixiModule,
    TilesetModule,
  ],
  declarations: [AppComponent, MainComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
