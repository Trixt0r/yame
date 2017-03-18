import { SidebarComponent } from './sidebar';
import { PixiComponent } from './pixi';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ResizeEvent } from 'angular-resizable-element';

import Grid from '../pixi/utils/grid';
import Camera from '../pixi/utils/camera';
import initCameraMouse from '../pixi/utils/input/camera';

@Component({
  moduleId: module.id,
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: ['app.css']
})
export class AppComponent {
  name = 'YAME';

  @ViewChild('pixi') pixi: PixiComponent;
  @ViewChild('sidebar') sidebar: SidebarComponent;

  grid: Grid;
  camera: Camera;

  constructor(public ref: ElementRef) {
  }

  /** @inheritdoc */
  ngAfterViewInit() {
    this.grid = new Grid(this.pixi.scene);

    this.camera = new Camera();
    this.camera.attach(this.pixi.scene);

    initCameraMouse(this.pixi.app.renderer, this.camera, this.pixi.scene);
    this.camera.on('update', () => this.grid.update(this.pixi.$parent.outerWidth(), this.pixi.$parent.outerHeight()));
    this.camera.emit('update'); // Force grid rendering
  }

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  sidebarUpdate(left: number): void {
    this.pixi.$el.css('width', left);
    this.pixi.onResize();
  }

  /**
   * Pixi update handler.
   * @param {{width: number, height: number}} size
   */
  pixiUpdate(size: {width: number, height: number}): void {
    if (this.grid)
      this.grid.update(size.width, size.height);
  }
}
