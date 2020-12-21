import { PixiRendererService } from '../services/renderer.service';
import { System } from '@trixt0r/ecs';
import Camera from '../utils/camera';
import { Point } from 'pixi.js';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { Keydown, Keyup } from 'ng/states/hotkey.state';

enum MoveInitiator {
  MOUSE, WHEEL, KEYBOARD
}

const tmpPos = new Point();

export class PixiCameraSystem extends System {

  public readonly camera: Camera;

  /**
   * Whether track pad mode is active (for notebooks without a mouse).
   */
  public trackPad = false;

  /**
   * The mouse button to be pressed for moving the camera.
   */
  public mouseMoveButton = 1;

  private prevPos: Point | null = null;
  private camPos: Point | null = null;
  private lastBoundElement?: HTMLElement;
  private moveInitiator: MoveInitiator = MoveInitiator.MOUSE;

  private onMouseWheelBound: (event: WheelEvent) => void;
  private onPointerDownBound: (event: PointerEvent) => void;
  private onPointerMoveBound: (event: PointerEvent) => void;
  private onPointerUpBound: (event: PointerEvent) => void;
  private keyboardSubs: Subscription[] = [];

  /**
   * Determines whether the movement session is active.
   */
  get moving(): boolean {
    return this.prevPos !== null;
  }

  constructor(protected service: PixiRendererService, protected actions: Actions, priority?: number) {
    super(priority);
    this.camera = new Camera();
    this.camera.attach(service.scene);
    this.camera.on('updated', () => service.engineService.run());

    this.onMouseWheelBound = this.onMouseWheel.bind(this);
    this.onPointerDownBound = this.onPointerDown.bind(this);
    this.onPointerMoveBound = this.onPointerMove.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);
    this.onActivated();
  }


  /**
   * Removes all listeners and subscriptions.
   */
  private clearListenersAndSubs() {
    if (this.lastBoundElement) {
      this.lastBoundElement.removeEventListener('mousewheel', this.onMouseWheelBound as EventListenerOrEventListenerObject);
      this.lastBoundElement.removeEventListener('pointerdown', this.onPointerDownBound);
      this.keyboardSubs.forEach(sub => sub.unsubscribe());
    }
  }

  /**
   * Initializes the camera system, i.e. sets up all listeners and subscriptions.
   */
  init(): void {
    this.clearListenersAndSubs();
    this.lastBoundElement = this.service.component.ref.nativeElement;
    this.lastBoundElement.addEventListener('mousewheel', this.onMouseWheelBound as EventListenerOrEventListenerObject);
    this.lastBoundElement.addEventListener('pointerdown', this.onPointerDownBound);
    this.keyboardSubs = [
      this.actions.pipe(ofActionSuccessful(Keydown)).subscribe((data: Keydown) => {
        if (data.shortcut.id !== 'camera.move' || this.moving) return;
        this.moveInitiator = MoveInitiator.KEYBOARD;
        this.begin();
      }),
      this.actions.pipe(ofActionSuccessful(Keyup)).subscribe((data: Keyup) => {
        if (data.shortcut.id !== 'camera.move' || !this.moving || this.moveInitiator !== MoveInitiator.KEYBOARD) return;
        this.end();
      })
    ];
  }

  /**
   * Begins the camera movement session.
   */
  begin(): void {
    if (this.moving) return;
    this.lastBoundElement?.querySelector('canvas')?.setAttribute('style', 'cursor: grabbing !important');
    const service = this.service;
    const data = service.renderer?.plugins.interaction.eventData.data;
    this.prevPos = data.getLocalPosition(service.stage, null, service.renderer?.plugins.interaction.eventData.data.global);
    this.camPos = new Point(this.camera.position?.x, this.camera.position?.y);
    window.addEventListener('pointermove', this.onPointerMoveBound);
  }

  /**
   * Ends the camera movement session.
   */
  end(): void {
    this.prevPos = null;
    if (this.lastBoundElement) this.lastBoundElement.querySelector('canvas')?.setAttribute('style', '');
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
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
    this.clearListenersAndSubs();
    this.end();
  }

  /**
   * Handles the mouse wheel event, which causes the camera to zoom.
   *
   * @param event The triggered mouse wheel event.
   */
  onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    if (this.trackPad && !event.ctrlKey) {
      if (!this.moving) {
        this.moveInitiator = MoveInitiator.WHEEL;
        this.begin();
      }
      tmpPos.set(
        this.camera.position!.x + event.deltaX * (2 - this.camera.zoom),
        this.camera.position!.y + event.deltaY * (2 - this.camera.zoom)
      );
      this.camera.position = tmpPos;
      return;
    }
    if (this.moving && this.moveInitiator === MoveInitiator.WHEEL) this.end();
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
  onPointerDown(event: PointerEvent): void {
    if (this.moving && this.moveInitiator === MoveInitiator.WHEEL) this.end();
    if (event.button !== this.mouseMoveButton) return; // Only listen for right click
    window.addEventListener('pointerup', this.onPointerUpBound);
    this.moveInitiator = MoveInitiator.MOUSE;
    this.begin();
  }

  /**
   * Handles the mouse up event, which resets the internal data.
   */
  onPointerUp(event: PointerEvent): void {
    if (!this.moving || this.moveInitiator !== MoveInitiator.MOUSE) return; // Only listen for right click
    this.end();
  }

  /**
   * Handles the mouse up event, which makes the camera move.
   *
   * @param event THe triggered mouse move event.
   */
  onPointerMove(event: PointerEvent): void {
    if (!this.moving || this.moveInitiator === MoveInitiator.WHEEL) return this.end(); // Only listen for right click
    if (this.moveInitiator === MoveInitiator.KEYBOARD) event.stopImmediatePropagation();
    const service = this.service;
    const data = service.renderer?.plugins.interaction.eventData.data;
    const pos = data.getLocalPosition(service.stage, null, { x: event.clientX, y: event.clientY });
    tmpPos.set((this.camPos?.x || 0) + (pos.x - this.prevPos!.x), (this.camPos?.y || 0) + (pos.y - this.prevPos!.y));
    this.camera.position = tmpPos;
  }

}
