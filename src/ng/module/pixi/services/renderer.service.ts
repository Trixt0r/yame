import { ISceneRenderer, SceneComponent, ISceneRendererComponent, EngineService, SortEntity, SceneService } from '../../scene';
import { Asset } from 'common/asset';
import {
  Application,
  Container,
  Point,
  Rectangle,
  RoundedRectangle,
  Circle,
  Ellipse,
  Polygon,
  IPointData,
  Renderer,
  Ticker,
  Transform,
} from 'pixi.js';
import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { SceneEntity, PointSceneComponent, RangeSceneComponent } from 'common/scene';
import { Actions, ofActionSuccessful } from '@ngxs/store';

const tempPoint = new Point();

@Injectable({ providedIn: 'root' })
export class PixiRendererService implements ISceneRenderer {
  /**
   * Internal scene component reference.
   */
  protected comp: SceneComponent;

  /**
   * Internal application reference.
   */
  protected _app: Application;

  /**
   * A map which maps an entity id to the corresponding pixi.js container.
   */
  protected pixiContainers: { [key: string]: Container } = {};

  protected _previewEntity: SceneEntity;

  public readonly init$: Subject<void> = new Subject();
  public readonly resize$: Subject<{ width: number; height: number }> = new Subject();

  /**
   * @inheritdoc
   */
  sceneService: SceneService;

  /**
   * The scene container reference.
   */
  public readonly scene: Container = new Container();

  get diagnostics(): { [label: string]: number | string | boolean } {
    return this.engineService.diagnostics;
  }

  /**
   * The pixi application
   */
  get app(): Application {
    return this._app;
  }

  /**
   * The pixi renderer instance.
   */
  get renderer(): Renderer {
    return this._app.renderer;
  }

  /**
   * The stage container. The root container.
   */
  get stage(): Container {
    return this._app.stage;
  }

  /**
   * The canvas element.
   */
  get view(): HTMLCanvasElement {
    return this._app.view;
  }

  /**
   * The pixi ticker, i.e. main loop.
   */
  get ticker(): Ticker {
    return this._app.ticker;
  }

  /**
   * The pixi screen, i.e. current dimensions.
   */
  get screen(): Rectangle {
    return this._app.screen;
  }

  /**
   * The global mouse coordinates.
   */
  get mouse(): IPointData {
    return this._app.renderer.plugins.interaction.mouse.global;
  }

  constructor(public readonly engineService: EngineService, public readonly actions: Actions, public readonly zone: NgZone) {
    const engine = engineService.engine;

    this.zone.runOutsideAngular(() => {
      actions.pipe(ofActionSuccessful(SortEntity))
              .subscribe((action: SortEntity) => {
                const data = Array.isArray(action.data) ? action.data : [action.data];
                const parents: string[] = [];
                data.forEach(it => {
                  if (it.parent === it.oldParent) return
                  const container = this.getContainer(it.id);
                  const oldParent = this.getContainer(it.oldParent) || this.scene;
                  const newParent = this.getContainer(it.parent) || this.scene;

                  const mat = newParent.worldTransform.clone().invert().append(container.worldTransform.clone());
                  const transform = new Transform();
                  mat.decompose(transform);

                  newParent.toLocal(container.position, oldParent, container.position);
                  const entity = this.sceneService.getEntity(it.id);
                  const position = entity.components.byId('transformation.position') as PointSceneComponent;
                  const scale = entity.components.byId('transformation.scale') as PointSceneComponent;
                  const skew = entity.components.byId('transformation.skew') as PointSceneComponent;
                  const rotation = entity.components.byId('transformation.rotation') as RangeSceneComponent;

                  rotation.value = transform.rotation;
                  scale.x = transform.scale.x;
                  scale.y = transform.scale.y;
                  skew.x = transform.skew.x;
                  skew.y = transform.skew.y;
                  position.x = container.position.x;
                  position.y = container.position.y;
                  newParent.addChild(container);
                  if (it.parent && parents.indexOf(it.parent) < 0) parents.push(it.parent);
                  if (it.oldParent && parents.indexOf(it.oldParent) < 0) parents.push(it.oldParent);
                });

                const pushParents = (source: string[]) => {
                  if (source.length === 0) return;
                  const pushed = [];
                  source.forEach(id => {
                    const entity = this.sceneService.getEntity(id);
                    if (!entity) return;
                    const parent = entity.parent;
                    if (!parent || parents.indexOf(parent) >= 0) return;
                    parents.push(parent);
                    pushed.push(parent);
                  });
                  pushParents(pushed);
                };

                pushParents(parents);

                parents.forEach(id => {
                  const container = this.getContainer(id);
                  if (!container) return;
                  const parentEntity = this.sceneService.getEntity(id);
                  container.calculateBounds();
                  const bounds: Rectangle = container.getLocalBounds();
                  tempPoint.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
                  if (container.parent) {
                    container.parent.toLocal(tempPoint, container, container.position);
                    const parentPosition = parentEntity.components.byId('transformation.position') as PointSceneComponent;
                    parentPosition.x = container.position.x;
                    parentPosition.y = container.position.y;
                  }
                  const parentPivot = parentEntity.components.byId('transformation.pivot') as PointSceneComponent;
                  parentPivot.x = tempPoint.x
                  parentPivot.y = tempPoint.y;
                  container.pivot.set( parentPivot.x, parentPivot.y);
                });
              });

      const self = this;
      engine.addListener({
        onAddedEntities(...entities: SceneEntity[]) {
          entities.forEach((entity) => {
            self.pixiContainers[entity.id] = new Container();
            const parentContainer = self.pixiContainers[entity.parent] || self.scene;
            if (parentContainer) parentContainer.addChild(self.pixiContainers[entity.id]);
          });
        },
        onRemovedEntities(...entities: SceneEntity[]) {
          entities.forEach((entity) => {
            const container = self.pixiContainers[entity.id];
            if (container.parent) container.parent.removeChild(self.pixiContainers[entity.id]);
          });
        },
      });
    });
  }

  set component(comp: SceneComponent) {
    if (this._app) this._app.destroy();
    this.comp = comp;
    this._app = new Application({
      antialias: true,
      autoDensity: true,
      transparent: true,
      view: this.comp.ref.nativeElement.querySelector('canvas'),
    });
    this._app.stage.addChild(this.scene);
    this._app.stop();
    this.setSize(this.comp.width, this.comp.height);
    this.init$.next();
  }

  get component(): SceneComponent {
    return this.comp;
  }

  setSize(width: number, height: number): void {
    if (!this._app) return;
    this.renderer.resize(width, height);
    this.resize$.next({ width, height });
    this.engineService.run();
  }

  projectToScene(x: number, y: number) {
    return this.scene.toLocal(new Point(x, y));
  }

  createPreview(x: number, y: number, asset: Asset) {
    this.zone.runOutsideAngular(() => {
      this.sceneService.createEntity(x, y, asset).subscribe(entity => {
        this._previewEntity = entity;
        this._previewEntity.components.add({ id: 'sprite.animate', type: 'boolean', boolean: true, group: 'sprite' });
        const container = new Container();
        this.scene.addChild(container);
        container.alpha = 0.5;
        this.pixiContainers[entity.id] = container;
        this.engineService.engine.entities.add(this._previewEntity);
        this.engineService.run();
      });
    });
  }

  updatePreview(x: number, y: number): void {
    if (!this._previewEntity) return;
    const container = this.getContainer(this._previewEntity.id);
    if (!container) return;
    container.position.copyFrom(this.projectToScene(x, y));
    const position = this._previewEntity.components.byId('transformation.position') as PointSceneComponent;
    position.x = container.position.x;
    position.y = container.position.y;
    container.alpha = 0.5;
    this.engineService.run();
  }

  removePreview(): void {
    if (!this._previewEntity) return;
    this.scene.removeChild(this.pixiContainers[this._previewEntity.id]);
    this.engineService.engine.entities.remove(this._previewEntity);
    delete this.pixiContainers[this._previewEntity.id];
    delete this._previewEntity;
    this.engineService.run();
  }

  dispose(): void {
    if (!this._app) return;
    this._app.destroy();
    this.init$.complete();
    this.resize$.complete();
  }

  getContainer(id: string): Container {
    return this.pixiContainers[id];
  }

  getShape(id: string): Rectangle | RoundedRectangle | Circle | Ellipse | Polygon {
    const container = this.getContainer(id);
    if (container) return container.getLocalBounds();
    else return null;
  }

  containsPoint(id: string, point: Point): boolean {
    const bounds = this.getShape(id);
    if (!bounds) return false;
    if (typeof bounds.contains !== 'function') {
      console.warn('The following shape does not implement a "contains" function: ', bounds, 'entity: ', id);
      return false;
    }
    const container = this.getContainer(id);
    container.worldTransform.applyInverse(point, tempPoint);
    return bounds.contains(tempPoint.x, tempPoint.y);
  }
}
