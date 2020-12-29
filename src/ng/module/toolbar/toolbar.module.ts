import { NgModule, APP_INITIALIZER } from '@angular/core';
import { MaterialModule } from '../material.module';
import { CommonModule } from '@angular/common';
import { ToolDirective } from './directives/tool.directive';
import { DefaultToolComponent } from './components/tool/default/default.component';
import { SelectionToolService } from './tools/selection';
import { NgxsModule, Store } from '@ngxs/store';
import { ToolbarState } from './states/toolbar.state';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { RegisterTool } from './states/actions/toolbar.action';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    NgxsModule.forFeature([ToolbarState])
  ],
  declarations: [
    ToolbarComponent,
    DefaultToolComponent,
    ToolDirective
  ],
  exports: [ ToolbarComponent ],
  providers: [
    SelectionToolService,
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, tool: SelectionToolService) => () => {
        store.dispatch(new RegisterTool(tool));
      },
      deps: [
        Store,
        SelectionToolService
      ],
      multi: true,
    }
  ]
})
export class ToolbarModule { }
