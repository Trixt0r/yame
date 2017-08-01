import { DirectoryGroupComponent } from './renderer/module/workspace/component/groups/component/group/directory';
import { GroupComponentService } from './renderer/module/workspace/service/group-component';

import { AssetService } from './renderer/module/workspace/service/asset';
import { ReflectiveInjector } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import convertDirectory from './renderer/module/workspace/service/converter/directory';

import { AppModule } from './renderer/module/app';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(ref => {
    // Register default directory converter and component
    ref.injector.get(AssetService).registerFsConverter('directory', convertDirectory);
    ref.injector.get(GroupComponentService).register('directory', DirectoryGroupComponent);
  });
