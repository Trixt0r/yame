import { PixiRendererService } from '../services/renderer.service';
import { System } from '@trixt0r/ecs';
import Camera from '../utils/camera';
import { Point, Rectangle } from 'pixi.js';
import { Actions, ofActionDispatched, ofActionSuccessful, Select } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { Keydown, Keyup } from 'ng/states/hotkey.state';
import { CameraState } from 'ng/modules/camera/states/camera.state';
import {
  MoveCameraToPosition,
  UpdateCameraPosition,
  UpdateCameraZoom,
  ZoomCameraOut,
  ZoomCameraToPosition,
} from 'ng/modules/camera/states/actions/camera.action';
import { IPoint } from 'common/math';
import { SceneState, SelectState } from 'ng/modules/scene';
import { SceneComponent, SceneEntity } from 'common/scene';
import { getBoundingRect } from '../utils/bounds.utils';
import { CameraZoom } from 'ng/modules/camera/camera-zoom.interface';

enum MoveInitiator {
  MOUSE,
  WHEEL,
  KEYBOARD,
}

const tmpPos = new Point();
const tmpRect = new Rectangle();

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

  /**
   * Selector for getting the current camera zoom value.
   */
  @Select(CameraState.zoom) cameraZoom$!: Observable<CameraZoom>;

  /**
   * Selector for getting the current camera position.
   */
  @Select(CameraState.position) cameraPosition$!: Observable<IPoint>;

  /**
   * Selector for getting the current entities in the scene.
   */
  @Select(SceneState.entities) entities$!: Observable<SceneEntity[]>;

  /**
   * Selector for getting all selected entity ids.
   */
  @Select(SelectState.entities) selectedEntities$!: Observable<string[]>;

  /**
   * Selector for getting the selected entity components.
   */
  @Select(SelectState.components) selectedComponents$!: Observable<SceneComponent[]>;

  /**
   * Selector for getting the isolated entity.
   */
  @Select(SelectState.isolated) isolated$!: Observable<SceneEntity | null>;

  /**
   * A list of all current entities having no parent entity.
   */
  rootEntities: SceneEntity[] = [];

  /**
   * A list of selected entity ids.
   */
  selectedEntities: string[] = [];

  /**
   * A list of selected entity components
   */
  selectedComponents: SceneComponent[] = [];

  /**
   * The isolated entity.
   */
  isolated: SceneEntity | null = null;

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
      this.lastBoundElement.removeEventListener(
        'mousewheel',
        this.onMouseWheelBound as EventListenerOrEventListenerObject
      );
      this.lastBoundElement.removeEventListener('pointerdown', this.onPointerDownBound);
      this.keyboardSubs.forEach((sub) => sub.unsubscribe());
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
      }),
    ];

    this.entities$.subscribe(entities => this.rootEntities = entities.filter(it => !it.parent));

    this.selectedEntities$.subscribe(entities => this.selectedEntities = entities);
    this.selectedComponents$.subscribe(components => this.selectedComponents = components);
    this.isolated$.subscribe(isolated => this.isolated = isolated);

    this.cameraZoom$.subscribe((zoom) => {
      (this.camera.targetPosition as Point).copyFrom(zoom.target);
      this.camera.minZoom = zoom.min ?? this.camera.minZoom;
      this.camera.maxZoom = zoom.max ?? this.camera.maxZoom;
      this.camera.zoomStep = zoom.step ?? this.camera.zoomStep;
      this.camera.zoom = zoom.value;
      this.service.store.dispatch(new UpdateCameraPosition(this.camera.position as IPoint));
    });
    this.cameraPosition$.subscribe((pos) => (this.camera.position = pos));
    this.actions.pipe(ofActionDispatched(ZoomCameraToPosition)).subscribe((action: ZoomCameraToPosition) => {
      if (action.target)
        this.camera.targetPosition = action.global
          ? this.service.stage!.toLocal(action.target)
          : action.target;
      this.camera.zoom = action.zoom;
      const zoom = {
        target: this.camera.targetPosition,
        value: this.camera.zoom,
      };
      this.service.store.dispatch(new UpdateCameraZoom(zoom));
    });
    this.actions.pipe(ofActionDispatched(MoveCameraToPosition)).subscribe((action: MoveCameraToPosition) => {
      this.service.store.dispatch(
        new UpdateCameraPosition(
          action.global ? this.service.stage!.toLocal(action.position) : action.position
        )
      );
    });
    this.actions.pipe(ofActionDispatched(ZoomCameraOut))
                  .subscribe((action: ZoomCameraOut) => {
                    const isolated = this.isolated;
                    if (action.entities.length > 0) {
                      this.zoomToEntities(action.entities.map(it => this.service.sceneService.getEntity(it)) as SceneEntity[]);
                    } else {
                      if (isolated) this.zoomToEntities(this.service.sceneService.getChildren(isolated));
                      else this.zoomToEntities(this.rootEntities);
                    }
                  });
  }

  /**
   * Begins the camera movement session.
   */
  begin(): void {
    if (this.moving) return;
    this.lastBoundElement?.querySelector('canvas')?.setAttribute('style', 'cursor: grabbing !important');
    this.prevPos = this.service.stage!.toLocal(this.service.mouse);
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
   * Zooms the camera to the given entities, so that every entity will be visible in the current viewport.
   *
   * @param entities The entities to show.
   */
  async zoomToEntities(entities: SceneEntity[]): Promise<void> {
    if (!this.service.renderer) return;
    // Get the bounds in scene space and adjust the zoom accordingly
    const bounds = getBoundingRect(entities, this.service, this.service.scene, tmpRect);
    const value = Math.min(
      this.service.renderer.width / bounds.width,
      this.service.renderer.height / bounds.height
    );
    const step = this.camera.zoomStep;
    this.camera.zoomStep = Math.abs(this.camera.zoom - value);
    this.camera.zoom = value;
    this.camera.position = { x: 0, y: 0 };

    const stageBounds = getBoundingRect(entities, this.service, this.service.stage!, tmpRect);
    const widthDiff = this.service.renderer.width - stageBounds.width;
    const heightDiff = this.service.renderer.height - stageBounds.height;
    this.camera.position = {
      x: widthDiff - (stageBounds.x + widthDiff / 2),
      y: heightDiff - (stageBounds.y + heightDiff / 2)
    };

    await this.service.store.dispatch(new UpdateCameraZoom({ value, step })).toPromise();
  }

  /**
   * @inheritdoc
   */
  process(): void {}

  /**
   * @inheritdoc
   */
  onActivated() {
    if (!this.service.component) this.service.init$.subscribe(() => this.init());
    else this.init();
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
      this.service.store.dispatch(new MoveCameraToPosition(tmpPos, false));
    } else {
      if (this.moving && this.moveInitiator === MoveInitiator.WHEEL) this.end();
      this.service.store.dispatch(
        new ZoomCameraToPosition(event.deltaY < 0 ? this.camera.maxZoom : this.camera.minZoom, this.service.mouse)
      );
    }
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
   * @param event The triggered mouse move event.
   */
  onPointerMove(event: PointerEvent): void {
    if (!this.moving || this.moveInitiator === MoveInitiator.WHEEL) return this.end(); // Only listen for right click
    if (this.moveInitiator === MoveInitiator.KEYBOARD) event.stopImmediatePropagation();
    const pos = this.service.stage!.toLocal(this.service.mouse);
    tmpPos.set(this.camPos!.x + (pos.x - this.prevPos!.x), this.camPos!.y + (pos.y - this.prevPos!.y));
    this.service.store.dispatch(new MoveCameraToPosition(tmpPos, false));
  }
}
