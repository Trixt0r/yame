import { AbstractComponent } from './abstract';
import { PixiComponent } from '../module/pixi/component';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { WorkspaceComponent } from "../module/workspace/component";

@Component({
  moduleId: module.id,
  selector: 'main',
  templateUrl: 'main.html',
  styleUrls: ['./main.scss']
})
export class MainComponent extends AbstractComponent {

  @ViewChild('pixi') pixi: PixiComponent;
  @ViewChild('workspace') workspace: WorkspaceComponent;

  constructor(public ref: ElementRef) {
    super(ref);
  }

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  sidebarUpdate(left: number): void {
    this.elementRef.nativeElement.style['width'] = `${left}px`;
    this.pixi.elementRef.nativeElement.style['width'] = `${left}px`;
    this.pixi.onResize();
    this.workspace.onResize();
  }

  sizeUpdated(top: number): void {
    this.pixi.elementRef.nativeElement.style['height'] = `${top}px`;
    this.pixi.onResize();
  }

}
