import { PixiComponent } from '../component';
import { Camera } from '../utils/camera';
import { AfterViewInit, Directive, ElementRef, HostListener, Input } from '@angular/core';

let tmpPos = new PIXI.Point();

/**
 *
 */
@Directive({
  selector: 'pixi[pixiCamera]'
})
export class PixiCameraDirective implements AfterViewInit {

  interactive = true;

  private cam: Camera;
  private prevPos: PIXI.Point;
  private camPos: PIXI.Point;

  constructor(private host: PixiComponent) { }

  @HostListener('mousewheel', ['$event'])
  onMouseWheel(event: MouseWheelEvent) {
    if (!this.interactive) return;
    let service = this.host.pixiService;
    let data = service.renderer.plugins.interaction.eventData.data;
    this.cam.targetPosition = data.getLocalPosition(service.scene, null, {x: event.clientX, y: event.clientY});
    if (event.wheelDelta > 0)
      this.cam.zoom = this.cam.maxZoom;
    else if (event.wheelDelta < 0)
      this.cam.zoom = this.cam.minZoom;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (!this.interactive) return;
    if (event.which !== 3) return; // Only listen for right click
    let service = this.host.pixiService;
    let data = service.renderer.plugins.interaction.eventData.data;
    this.prevPos = data.getLocalPosition(service.stage, null, {x: event.clientX, y: event.clientY});
    this.camPos = new PIXI.Point(this.cam.position.x, this.cam.position.y);
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (!this.interactive) return;
    if (event.which !== 3) return; // Only listen for right click
    this.prevPos = null;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.interactive) return;
    if (event.which !== 3 || !this.prevPos) return; // Only listen for right click
    let service = this.host.pixiService;
    let data = service.renderer.plugins.interaction.eventData.data;
    let pos = data.getLocalPosition(service.stage, null, {x: event.clientX, y: event.clientY});
    tmpPos.set(this.camPos.x + (pos.x - this.prevPos.x), this.camPos.y + (pos.y - this.prevPos.y));
    this.cam.position = tmpPos;
  }

  /** @inheritdoc */
  ngAfterViewInit() {
    this.cam = new Camera();
    this.cam.attach(this.host.pixiService.scene);
  }

  /**
   * @readonly
   * @type The camera instance for this directive.
   */
  get camera() {
    return this.cam;
  }
}
