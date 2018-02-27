import { NgModule } from "@angular/core";
import { ToolbarComponent } from "./toolbar/component";
import { MaterialModule } from "./material";
import { CommonModule } from "@angular/common";

@NgModule({
  imports: [ CommonModule, MaterialModule ],
  declarations: [ ToolbarComponent ],
  exports: [ ToolbarComponent ]
})
export class ToolbarModule { }
