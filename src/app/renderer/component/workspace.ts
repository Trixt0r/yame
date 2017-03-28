import { ResizeableComponent } from './utils/resizable';
import { AbstractComponent } from './abstract';
import { Component, ElementRef } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'workspace',
  templateUrl: 'workspace.html',
  styleUrls: ['workspace.css']
})
export class WorkspaceComponent extends ResizeableComponent {

  constructor(public ref: ElementRef) {
    super(ref, 'top', 100, window.innerHeight - 100);
  }

  /** @override */
  onResize() {
    this.maxVal = window.innerHeight - 100;
    super.onResize();
  }

}