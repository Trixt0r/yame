import { PixiComponent } from '../component';
import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { Grid } from 'ng/module/pixi/utils/grid';
import { Camera } from 'ng/module/pixi/utils/camera';

@Directive({
  selector: 'pixi[pixiGrid]'
})
export class PixiGridDirective implements AfterViewInit {

  private internalGrid: Grid;
  private currentCam: Camera;

  constructor(private host: PixiComponent) {
  }

  ngAfterViewInit() {
    let parent = (<HTMLElement>this.host.ref.nativeElement);
    let width = parent.offsetWidth;
    let height = parent.offsetHeight;
    this.internalGrid = new Grid(this.host.pixiService.scene);
    this.internalGrid.update(width, height);
  }

  get grid() {
    return this.internalGrid;
  }

  update() {
    let parent = (<HTMLElement>this.host.ref.nativeElement);
    this.internalGrid.update(parent.offsetWidth, parent.offsetHeight);
  }

  listenToCamera(camera: Camera) {
    if (this.currentCam)
      this.currentCam.off('update', this.update, this);
    if (!camera) return;
    this.currentCam = camera;
    camera.on('update', this.update, this);
  }
}
