import { MainComponent } from '../component/main';
import { WorkspaceComponent } from '../component/workspace';
import { SidebarDirective } from '../component/sidebar/directive';
import { PixiService } from './pixi/service';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TreeModule } from 'angular-tree-component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PixiModule } from './pixi';

import { AppComponent } from '../component/app';
import { SidebarComponent } from '../component/sidebar';

@NgModule({
  imports: [BrowserModule, PixiModule, TreeModule, NgbModule.forRoot()],
  declarations: [
    AppComponent,
    MainComponent,
    SidebarComponent,
    WorkspaceComponent,
    SidebarDirective
  ],
  providers: [PixiService],
  bootstrap: [AppComponent],
})
export class AppModule {}