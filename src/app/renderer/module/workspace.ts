import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UtilsModule } from "./utils";
import { MaterialModule } from './material';

import { AssetsComponent } from './workspace/component/assets';
import { FoldersComponent } from './workspace/component/folders';
import { WorkspaceComponent } from './workspace/component';

import { WorkspaceService } from './workspace/service';

@NgModule({
  imports: [BrowserModule, UtilsModule, MaterialModule],
  exports: [
    WorkspaceComponent,
    FoldersComponent,
    AssetsComponent
  ],
  declarations: [
    WorkspaceComponent,
    FoldersComponent,
    AssetsComponent
  ],
  providers: [ WorkspaceService ]
})
export class WorkspaceModule { }