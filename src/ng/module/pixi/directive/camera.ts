import { PixiComponent } from '../component';
import { Camera } from '../utils/camera';
import { AfterViewInit, Directive, ElementRef, HostListener, Input, NgZone } from '@angular/core';
import { Point } from 'pixi.js';

const tmpPos = new Point();

/**
 * Directive which can be attached to a pixi component.
 * This directive will add a camera to the scene,
 * handle mouse input and update the camera according to the input.
 */
@Directive({
  selector: 'yame-pixi[pixiCamera]',
})
export class PixiCameraDirective implements AfterViewInit {
  interactive = true;

  private cam: Camera;
  private prevPos: Point;
  private camPos: Point;

  private onMouseWheelBind: EventListenerObject;
  private onMouseDownBind: EventListenerObject;
  private onMouseMoveBind: EventListenerObject;
  private onMouseUpBind: EventListenerObject;

  constructor(private host: PixiComponent, private zone: NgZone) {
    this.prevPos = null;
    this.onMouseWheelBind = this.onMouseWheel.bind(this);
    this.onMouseDownBind = this.onMouseDown.bind(this);
    this.onMouseMoveBind = this.onMouseMove.bind(this);
    this.onMouseUpBind = this.onMouseUp.bind(this);
    this.zone.runOutsideAngular(() => {
      (<HTMLElement>host.ref.nativeElement).addEventListener('mousewheel', this.onMouseWheelBind);
      (<HTMLElement>host.ref.nativeElement).addEventListener('mousedown', this.onMouseDownBind);
    });
  }

  onMouseWheel(event: MouseWheelEvent) {
    if (!this.interactive) return;
    const service = this.host.pixiService;
    const data = service.renderer.plugins.interaction.eventData.data;
    this.cam.targetPosition = data.getLocalPosition(service.stage, null, { x: event.clientX, y: event.clientY });
    if (event.deltaY < 0) this.cam.zoom = this.cam.maxZoom;
    else if (event.deltaY > 0) this.cam.zoom = this.cam.minZoom;
  }

  onMouseDown(event: MouseEvent) {
    if (!this.interactive) return;
    if (event.which !== 3) return; // Only listen for right click
    window.addEventListener('mousemove', this.onMouseMoveBind);
    window.addEventListener('mouseup', this.onMouseUpBind);
    const service = this.host.pixiService;
    const data = service.renderer.plugins.interaction.eventData.data;
    this.prevPos = data.getLocalPosition(service.stage, null, { x: event.clientX, y: event.clientY });
    this.camPos = new Point(this.cam.position.x, this.cam.position.y);
  }

  onMouseUp(event: MouseEvent) {
    if (!this.interactive) return;
    if (event.which !== 3) return; // Only listen for right click
    window.removeEventListener('mousemove', this.onMouseMoveBind);
    window.removeEventListener('mouseup', this.onMouseUpBind);
    this.prevPos = null;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.interactive) return;
    if (event.which !== 3 || !this.prevPos) return; // Only listen for right click
    const service = this.host.pixiService;
    const data = service.renderer.plugins.interaction.eventData.data;
    const pos = data.getLocalPosition(service.stage, null, { x: event.clientX, y: event.clientY });
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
