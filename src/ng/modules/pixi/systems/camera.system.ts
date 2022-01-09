import { PixiRendererService } from '../services/renderer.service';
import { System } from '@trixt0r/ecs';
import { Point, Rectangle } from 'pixi.js';
import { Actions, ofActionDispatched, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { lastValueFrom, Observable } from 'rxjs';
import { CameraState } from 'ng/modules/camera/states/camera.state';
import { UpdateCameraPosition, UpdateCameraZoom, ZoomCameraOut } from 'ng/modules/camera/states/actions/camera.action';
import { IPoint } from 'common/math';
import { SceneState, SelectState } from 'ng/modules/scene';
import { SceneEntity } from 'common/scene';
import { getBoundingRect, Camera } from '../utils';
import { CameraZoom } from 'ng/modules/camera/camera-zoom.interface';
import { CameraId } from 'ng/modules/camera';

const tmpRect = new Rectangle();

export class PixiCameraSystem extends System {
  public readonly camera: Camera;

  /**
   * Selector for getting the current camera zoom value.
   */
  @Select(CameraState.zoom(CameraId.SCENE)) cameraZoom$!: Observable<CameraZoom>;

  /**
   * Selector for getting the current camera position.
   */
  @Select(CameraState.position(CameraId.SCENE)) cameraPosition$!: Observable<IPoint>;

  /**
   * Selector for getting the current entities in the scene.
   */
  @Select(SceneState.entities) entities$!: Observable<SceneEntity[]>;

  /**
   * Selector for getting all selected entity ids.
   */
  @Select(SelectState.entities) selectedEntities$!: Observable<string[]>;

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
   * The isolated entity.
   */
  isolated: SceneEntity | null = null;

  constructor(private service: PixiRendererService, private actions: Actions, private store: Store, priority?: number) {
    super(priority);
    this.camera = new Camera();
    this.camera.attach(service.scene);
    this.camera.on('updated', () => service.engineService.run());
    this.onActivated();
  }

  /**
   * Initializes the camera system, i.e. sets up all listeners and subscriptions.
   */
  init(): void {
    this.entities$.subscribe(entities => (this.rootEntities = entities.filter(it => !it.parent)));

    this.selectedEntities$.subscribe(entities => (this.selectedEntities = entities));
    this.isolated$.subscribe(isolated => (this.isolated = isolated));

    this.cameraZoom$.subscribe(async zoom => {
      (this.camera.targetPosition as Point).copyFrom(zoom.target);
      this.camera.minZoom = zoom.min ?? this.camera.minZoom;
      this.camera.maxZoom = zoom.max ?? this.camera.maxZoom;
      this.camera.zoomStep = zoom.step ?? this.camera.zoomStep;
      this.camera.zoom = zoom.value;
      const pos = { x: this.camera.position?.x, y: this.camera.position?.y };
      this.store.dispatch(new UpdateCameraPosition(CameraId.SCENE, pos as IPoint));
    });
    this.actions.pipe(ofActionSuccessful(UpdateCameraPosition)).subscribe((action: UpdateCameraPosition) => {
      if (action.id === CameraId.SCENE) this.camera.position = action.position;
    });
    this.actions.pipe(ofActionDispatched(ZoomCameraOut)).subscribe((action: ZoomCameraOut) => {
      if (action.id !== CameraId.SCENE) return;
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
   * Zooms the camera to the given entities, so that every entity will be visible in the current viewport.
   *
   * @param entities The entities to show.
   */
  async zoomToEntities(entities: SceneEntity[]): Promise<void> {
    if (!this.service.renderer) return;
    // Get the bounds in scene space and adjust the zoom accordingly
    const bounds = getBoundingRect(entities, this.service, this.service.scene, tmpRect);
    const value = Math.min(this.service.renderer.width / bounds.width, this.service.renderer.height / bounds.height);
    const step = this.camera.zoomStep;
    this.camera.zoomStep = Math.abs(this.camera.zoom - value);
    this.camera.zoom = value;
    this.camera.position = { x: 0, y: 0 };

    const stageBounds = getBoundingRect(entities, this.service, this.service.stage!, tmpRect);
    const widthDiff = this.service.renderer.width - stageBounds.width;
    const heightDiff = this.service.renderer.height - stageBounds.height;
    this.camera.position = {
      x: widthDiff - (stageBounds.x + widthDiff / 2),
      y: heightDiff - (stageBounds.y + heightDiff / 2),
    };

    await lastValueFrom(this.store.dispatch(new UpdateCameraZoom(CameraId.SCENE, { value, step })));
  }

  /**
   * @inheritdoc
   */
  process(): void {}

  /**
   * @inheritdoc
   */
  onActivated(): void {
    if (!this.service.component) this.service.init$.subscribe(() => this.init());
    else this.init();
  }
}
