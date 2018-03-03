import { Component } from "@angular/core";
import { ToolComponent } from "./tool";

/**
 * The default tool component displays the icon of the tool,
 *
 * @class DefaultToolComponent
 * @extends {ToolComponent}
 */
@Component({
  template: `<mat-icon mat-list-icon>{{ tool.icon ? tool.icon : 'build' }}</mat-icon>`,
  styles: [`
    mat-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }`]
})
export class DefaultToolComponent extends ToolComponent {

}
