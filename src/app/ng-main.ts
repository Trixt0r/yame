import { ImageAssetPreviewComponent } from './renderer/module/workspace/component/assets/component/preview/image';
import { FileAssetPreviewComponent } from './renderer/module/workspace/component/assets/component/preview/file';
import { AssetComponentService } from './renderer/module/workspace/service/asset-component';
import { DirectoryGroupComponent } from './renderer/module/workspace/component/groups/component/group/directory';
import { GroupComponentService } from './renderer/module/workspace/service/group-component';

import { AssetService } from './renderer/module/workspace/service/asset';
import { ReflectiveInjector } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import convertDirectory from './renderer/module/workspace/service/converter/directory';
import convertImage from './renderer/module/workspace/service/converter/image';

import { AppModule } from './renderer/module/app';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(ref => {
    // Register default directory converter and component
    ref.injector.get(AssetService).registerFsConverter('directory', convertDirectory);
    ref.injector.get(AssetService).registerFsConverter('png', convertImage);
    ref.injector.get(GroupComponentService).register('directory', DirectoryGroupComponent);
    ref.injector.get(AssetComponentService).registerPreview('file', FileAssetPreviewComponent);
    ref.injector.get(AssetComponentService).registerPreview('image', ImageAssetPreviewComponent);
  });
