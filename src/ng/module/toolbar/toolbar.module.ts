import { NgModule, APP_INITIALIZER } from '@angular/core';
import { ToolbarComponent } from './component';
import { MaterialModule } from '../material.module';
import { CommonModule } from '@angular/common';
import { ToolDirective } from './directive/tool';
import { DefaultToolComponent } from './component/default';
import { SelectionToolService } from './tools/selection';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule
  ],
  // entryComponents: [
  //   DefaultToolComponent
  // ],
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
      useFactory: () => () => { },
      deps: [SelectionToolService],
      multi: true,
    }
  ]
})
export class ToolbarModule { }
