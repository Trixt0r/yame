import { WorkspaceComponent } from './workspace';
import { AbstractComponent } from './abstract';
import { PixiComponent } from '../module/pixi/component';
import { ResizeableComponent } from './utils/resizable';
import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'main',
  templateUrl: 'main.html',
  styleUrls: ['main.css']
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
    this.$el.css('width', left);
    this.pixi.$el.css('width', left);
    this.pixi.onResize();
    this.workspace.onResize();
  }

  sizeUpdated(top: number): void {
    this.pixi.$el.css('height', top);
    this.pixi.onResize();
  }

}