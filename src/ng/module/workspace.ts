import { ImageAssetPreviewComponent } from './workspace/component/assets/component/preview/image';
import { AssetComponentService } from './workspace/service/asset-component';
import { AssetPreviewDirective } from './workspace/component/assets/directive/asset-preview';
import { FileAssetPreviewComponent } from './workspace/component/assets/component/preview/file';
import { GroupComponentService } from './workspace/service/group-component';
import { GroupDirective } from './workspace/component/groups/directive/group';
import { DirectoryGroupComponent } from './workspace/component/groups/component/group/directory';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UtilsModule } from './utils';
import { MaterialModule } from './material';

import { AssetsComponent } from './workspace/component/assets';
import { GroupsComponent } from './workspace/component/groups';
import { WorkspaceComponent } from './workspace/component';

import { WorkspaceService } from './workspace/service';
import { AssetService } from './workspace/service/asset';

import convertDirectory from './workspace/service/converter/directory';
import convertImage from './workspace/service/converter/image';
import { DndModule } from 'ng2-dnd';

@NgModule({
  imports: [BrowserModule, UtilsModule, MaterialModule, DndModule.forRoot()],
  // entryComponents: [DirectoryGroupComponent, FileAssetPreviewComponent, ImageAssetPreviewComponent],
  exports: [WorkspaceComponent, GroupsComponent, AssetsComponent],
  declarations: [
    WorkspaceComponent,
    GroupsComponent,
    AssetsComponent,
    GroupDirective,
    AssetPreviewDirective,
    DirectoryGroupComponent,
    FileAssetPreviewComponent,
    ImageAssetPreviewComponent,
  ],
  providers: [WorkspaceService, AssetService, GroupComponentService, AssetComponentService],
})
export class WorkspaceModule {
  constructor(
    workspace: WorkspaceService,
    assets: AssetService,
    groupComps: GroupComponentService,
    assetComps: AssetComponentService
  ) {
    // Register default directory converter and component
    assets.registerFsConverter('directory', convertDirectory);
    assets.registerFsConverter('png', convertImage);
    assets.registerFsConverter('jpg', convertImage);
    assets.registerFsConverter('jpeg', convertImage);
    assets.registerFsConverter('gif', convertImage);
    groupComps.register('directory', DirectoryGroupComponent);
    assetComps.registerPreview('file', FileAssetPreviewComponent);
    assetComps.registerPreview('image', ImageAssetPreviewComponent);
    // assetComps.registerMenuOptions('image', [
    //   {
    //     icon: 'info',
    //     title: 'Details',
    //     callback: (event, asset) => {
    //       let dialogRef = ref.injector.get(MatDialog).open(DialogContent);
    //       dialogRef.componentInstance.asset = {   };
    //       dialogRef.afterClosed().subscribe(result => console.log(result));
    //     }
    //   },
    // ]);
  }
}
