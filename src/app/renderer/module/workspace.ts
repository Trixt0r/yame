import { GroupComponentService } from './workspace/service/group-component';
import { GroupDirective } from './workspace/component/groups/directive/group';
import { DirectoryGroupComponent } from './workspace/component/groups/component/group/directory';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UtilsModule } from "./utils";
import { MaterialModule } from './material';

import { AssetsComponent } from './workspace/component/assets';
import { GroupsComponent } from './workspace/component/groups';
import { WorkspaceComponent } from './workspace/component';

import { WorkspaceService } from './workspace/service';
import { AssetService } from './workspace/service/asset';

@NgModule({
  imports: [BrowserModule, UtilsModule, MaterialModule],
  entryComponents: [
    DirectoryGroupComponent
  ],
  exports: [
    WorkspaceComponent,
    GroupsComponent,
    AssetsComponent,
  ],
  declarations: [
    WorkspaceComponent,
    GroupsComponent,
    AssetsComponent,
    GroupDirective,
    DirectoryGroupComponent
  ],
  providers: [ WorkspaceService, AssetService, GroupComponentService ],
})
export class WorkspaceModule { }
