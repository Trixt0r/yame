import { ModuleWithProviders, NgModule } from '@angular/core';
import { NGXS_PLUGINS } from '@ngxs/store';
import { OnBeforePlugin } from './onbefore.plugin';


@NgModule()
export class NgxsOnBeforePluginModule {
  static forRoot(): ModuleWithProviders<NgxsOnBeforePluginModule> {
    return {
      ngModule: NgxsOnBeforePluginModule,
      providers: [
        OnBeforePlugin,
        {
          provide: NGXS_PLUGINS,
          useClass: OnBeforePlugin,
          multi: true
        }
      ]
    };
  }
}