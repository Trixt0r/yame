import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { enableProdMode } from '@angular/core';
import { environment } from '../environments';
import { AppModule } from './module/app';

import { ImageAssetPreviewComponent } from './module/workspace/component/assets/component/preview/image';
import { FileAssetPreviewComponent } from './module/workspace/component/assets/component/preview/file';
import { AssetComponentService } from './module/workspace/service/asset-component';
import { DirectoryGroupComponent } from './module/workspace/component/groups/component/group/directory';
import { GroupComponentService } from './module/workspace/service/group-component';
import { AssetService } from './module/workspace/service/asset';
import convertDirectory from './module/workspace/service/converter/directory';
import convertImage from './module/workspace/service/converter/image';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(ref => {
    // Register default directory converter and component
    ref.injector.get(AssetService).registerFsConverter('directory', convertDirectory);
    ref.injector.get(AssetService).registerFsConverter('png', convertImage);
    ref.injector.get(GroupComponentService).register('directory', DirectoryGroupComponent);
    ref.injector.get(AssetComponentService).registerPreview('file', FileAssetPreviewComponent);
    ref.injector.get(AssetComponentService).registerPreview('image', ImageAssetPreviewComponent);
    ref.injector.get(AssetComponentService).registerMenuOptions('image', [
      // {
      //   icon: 'info',
      //   title: 'Details',
      //   callback: (event, asset) => {
      //     let dialogRef = ref.injector.get(MdDialog).open(DialogContent);
      //     dialogRef.componentInstance.asset = {   };
      //     dialogRef.afterClosed().subscribe(result => console.log(result));
      //   }
      // },
    ]);
  });
