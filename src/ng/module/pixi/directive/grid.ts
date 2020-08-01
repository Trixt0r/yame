import { AfterViewInit, Directive, ElementRef, HostListener } from '@angular/core';
import { PixiComponent } from '../component';
import { Grid } from '../utils/grid';
import { Camera } from '../utils/camera';

/**
 * Grid directive which can be attached to the pixi component.
 * This directive will create a grid and render it below the current scene.
 */
@Directive({
  selector: 'yame-pixi[pixiGrid]',
})
export class PixiGridDirective implements AfterViewInit {
  private internalGrid: Grid;
  private currentCam: Camera;

  constructor(private host: PixiComponent) {}

  /** @inheritdoc */
  ngAfterViewInit() {
    const parent = <HTMLElement>this.host.ref.nativeElement;
    const width = parent.offsetWidth;
    const height = parent.offsetHeight;
    this.internalGrid = new Grid(this.host.pixiService.scene);
    this.internalGrid.update(width, height);
  }

  /**
   * @readonly
   * @type {Grid}
   */
  get grid(): Grid {
    return this.internalGrid;
  }

  /**
   * Updates the grid, i.e. re-renders the grid based on the host's dimensions.
   * @returns {void}
   */
  @HostListener('resized')
  update() {
    if (!this.internalGrid) return;
    const parent = <HTMLElement>this.host.ref.nativeElement;
    this.internalGrid.update(parent.offsetWidth, parent.offsetHeight);
  }

  /**
   * Sets up the update event handler for the given camera.
   * @param {Camera} camera
   * @returns {void}
   */
  listenToCamera(camera: Camera) {
    if (this.currentCam) this.currentCam.off('updated', this.update, this);
    if (!camera) return;
    this.currentCam = camera;
    camera.on('updated', this.update, this);
  }
}
