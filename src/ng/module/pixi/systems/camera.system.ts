import { PixiRendererService } from '../services/renderer.service';
import { System } from '@trixt0r/ecs';
import Camera from '../utils/camera';
import { Point } from 'pixi.js';

const tmpPos = new Point();

export class PixiCameraSystem extends System {

  public readonly camera: Camera;

  private prevPos: Point | null = null;
  private camPos: Point | null = null;
  private lastBoundElement?: HTMLElement;

  private onMouseWheelBind: (event: WheelEvent) => void;
  private onMouseDownBind: (event: MouseEvent) => void;
  private onMouseMoveBind: (event: MouseEvent) => void;
  private onMouseUpBind: (event: MouseEvent) => void;

  constructor(protected service: PixiRendererService, priority?: number) {
    super(priority);
    this.camera = new Camera();
    this.camera.attach(service.scene);
    this.camera.on('updated', () => service.engineService.run());

    this.onMouseWheelBind = this.onMouseWheel.bind(this);
    this.onMouseDownBind = this.onMouseDown.bind(this);
    this.onMouseMoveBind = this.onMouseMove.bind(this);
    this.onMouseUpBind = this.onMouseUp.bind(this);
    this.onActivated();
  }

  init(): void {
    if (this.lastBoundElement) {
      this.lastBoundElement.removeEventListener('mousewheel', this.onMouseWheelBind as EventListenerOrEventListenerObject);
      this.lastBoundElement.removeEventListener('mousedown', this.onMouseDownBind);
    }
    this.lastBoundElement = this.service.component.ref.nativeElement;
    this.lastBoundElement.addEventListener('mousewheel', this.onMouseWheelBind as EventListenerOrEventListenerObject);
    this.lastBoundElement.addEventListener('mousedown', this.onMouseDownBind);
  }

  /**
   * Resets the mouse handlers.
   */
  reset(): void {
    this.prevPos = null;
    if (this.lastBoundElement) this.lastBoundElement.querySelector('canvas')?.setAttribute('style', '');
    window.removeEventListener('mousemove', this.onMouseMoveBind);
    window.removeEventListener('mouseup', this.onMouseUpBind);
  }

  /**
   * @inheritdoc
   */
  process(): void { }

  /**
   * @inheritdoc
   */
  onActivated() {
    if (!this.service.component) {
      this.service.init$.subscribe(() => this.init());
    } else {
      this.init();
    }
  }

  /**
   * @inheritdoc
   */
  onDeactivated() {
    if (this.lastBoundElement) {
      this.lastBoundElement.removeEventListener('mousewheel', this.onMouseWheelBind as EventListenerOrEventListenerObject);
      this.lastBoundElement.removeEventListener('mousedown', this.onMouseDownBind);
    }
    this.reset();
  }

  /**
   * Handles the mouse wheel event, which causes the camera to zoom.
   *
   * @param event The triggered mouse wheel event.
   */
  onMouseWheel(event: WheelEvent): void {
    const service = this.service;
    const data = service.renderer?.plugins.interaction.eventData.data;
    this.camera.targetPosition = data.getLocalPosition(service.stage, null, { x: event.clientX, y: event.clientY });
    if (event.deltaY < 0) this.camera.zoom = this.camera.maxZoom;
    else if (event.deltaY > 0) this.camera.zoom = this.camera.minZoom;
  }

  /**
   * Handles the mouse down event, which starts a camera move, if the right mouse button has been pressed.
   *
   * @param event The triggered mouse down event.
   */
  onMouseDown(event: MouseEvent): void {
    if (event.which !== 3) return; // Only listen for right click
    this.lastBoundElement?.querySelector('canvas')?.setAttribute('style', 'cursor: grabbing !important');
    window.addEventListener('mousemove', this.onMouseMoveBind);
    window.addEventListener('mouseup', this.onMouseUpBind);
    const service = this.service;
    const data = service.renderer?.plugins.interaction.eventData.data;
    this.prevPos = data.getLocalPosition(service.stage, null, { x: event.clientX, y: event.clientY });
    this.camPos = new Point(this.camera.position?.x, this.camera.position?.y);
  }

  /**
   * Handles the mouse up event, which resets the internal data.
   *
   * @param event The triggered mouse down event.
   */
  onMouseUp(event: MouseEvent): void {
    if (event.which !== 3) return; // Only listen for right click
    this.reset();
  }

  /**
   * Handles the mouse up event, which makes the camera move.
   *
   * @param event THe triggered mouse move event.
   */
  onMouseMove(event: MouseEvent): void {
    if (event.which !== 3 || !this.prevPos) return this.reset(); // Only listen for right click
    const service = this.service;
    const data = service.renderer?.plugins.interaction.eventData.data;
    const pos = data.getLocalPosition(service.stage, null, { x: event.clientX, y: event.clientY });
    tmpPos.set((this.camPos?.x || 0) + (pos.x - this.prevPos.x), (this.camPos?.y || 0) + (pos.y - this.prevPos.y));
    this.camera.position = tmpPos;
  }

}
