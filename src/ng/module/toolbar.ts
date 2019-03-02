import { NgModule } from '@angular/core';
import { ToolbarComponent } from './toolbar/component';
import { MaterialModule } from './material';
import { CommonModule } from '@angular/common';
import { ToolbarService } from './toolbar/service';
import { Tool } from './toolbar/tool';
import { ToolDirective } from './toolbar/directive/tool';
import { DefaultToolComponent } from './toolbar/component/default';
import { SelectionTool } from './toolbar/tools/selection';
import { NgxsModule } from '@ngxs/store';
import { SelectionState } from './toolbar/tools/selection/ngxs/state';

@NgModule({
  imports: [CommonModule, MaterialModule, NgxsModule.forFeature([SelectionState])],
  entryComponents: [DefaultToolComponent],
  declarations: [ToolbarComponent, DefaultToolComponent, ToolDirective],
  exports: [ToolbarComponent],
  providers: [ToolbarService],
})
export class ToolbarModule {
  constructor(service: ToolbarService) {
    service.register(new SelectionTool('edit', 'edit'));
    // service.register(new Tool('camera', 'videocam'));
  }
}
