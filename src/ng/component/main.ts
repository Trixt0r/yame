import { PixiComponent } from '../module/pixi/component';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { WorkspaceComponent } from "../module/workspace/component";

@Component({
  moduleId: module.id,
  selector: 'main',
  templateUrl: 'main.html',
  styleUrls: ['./main.scss']
})
export class MainComponent {

  @ViewChild('pixi') pixi: PixiComponent;
  @ViewChild('workspace') workspace: WorkspaceComponent;

  constructor(public ref: ElementRef) {
  }

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  sidebarUpdate(left: number): void {
    this.ref.nativeElement.style.width = `${left}px`;
    this.pixi.ref.nativeElement.width = `${left}px`;
    this.pixi.onResize();
    this.workspace.onResize();
  }

  sizeUpdated(top: number): void {
    this.pixi.ref.nativeElement.style['height'] = `${top}px`;
    this.pixi.onResize();
  }

}
