import { NgModule } from "@angular/core";
import { ToolbarComponent } from "./toolbar/component";
import { MaterialModule } from "./material";
import { CommonModule } from "@angular/common";
import { ToolbarService } from "./toolbar/service";
import { Tool } from "./toolbar/tool";
import { ToolDirective } from "./toolbar/directive/tool";
import { DefaultToolComponent } from "./toolbar/component/default";

@NgModule({
  imports: [ CommonModule, MaterialModule ],
  entryComponents: [ DefaultToolComponent ],
  declarations: [ ToolbarComponent, DefaultToolComponent, ToolDirective ],
  exports: [ ToolbarComponent ],
  providers: [ ToolbarService ]
})
export class ToolbarModule {

  constructor(service: ToolbarService) {
    service.register(new Tool('edit', 'edit'));
    service.register(new Tool('camera', 'videocam'));
  }
}