import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UtilsModule } from "./utils";
import { MaterialModule } from './material';

import { AssetsComponent } from './workspace/component/assets';
import { GroupsComponent } from './workspace/component/groups';
import { WorkspaceComponent } from './workspace/component';

import { WorkspaceService } from './workspace/service';

@NgModule({
  imports: [BrowserModule, UtilsModule, MaterialModule],
  exports: [
    WorkspaceComponent,
    GroupsComponent,
    AssetsComponent,
  ],
  declarations: [
    WorkspaceComponent,
    GroupsComponent,
    AssetsComponent,
  ],
  providers: [ WorkspaceService ]
})
export class WorkspaceModule { }