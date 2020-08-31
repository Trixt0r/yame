import {
  ISceneRenderer,
  SceneComponent as SceneComponentView,
  EngineService,
  SortEntity,
  SceneService,
} from '../../scene';
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
} from 'pixi.js';
import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { SceneEntity, PointSceneComponent, RangeSceneComponent, SceneComponent, SceneEntityType } from 'common/scene';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { transformTo } from '../utils/transform.utils';
import { SceneComponentCollection } from 'common/scene/component.collection';
import { maxBy } from 'lodash';
import { SizeSceneComponent } from 'common/scene/component/size';

const tempPoint = new Point();

@Injectable({ providedIn: 'root' })
export class PixiRendererService implements ISceneRenderer {
  /**
   * Internal scene component reference.
   */
  protected comp: SceneComponentView;

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

  constructor(
    public readonly engineService: EngineService,
    public readonly store: Store,
    public readonly actions: Actions,
    public readonly zone: NgZone
  ) {
    this.scene.sortableChildren = true;
    const engine = engineService.engine;

    this.zone.runOutsideAngular(() => {
      actions.pipe(ofActionSuccessful(SortEntity)).subscribe((action: SortEntity) => {
        const data = Array.isArray(action.data) ? action.data : [action.data];
        const parents: string[] = [];
        const restoreParent = {};
        data.forEach((it) => {
          if (it.parent === it.oldParent) return;
          const container = this.getContainer(it.id);
          const oldParent = this.getContainer(it.oldParent) || this.scene;
          const newParent = this.getContainer(it.parent) || this.scene;
          const entity = this.sceneService.getEntity(it.id);

          if (it.parent && parents.indexOf(it.parent) < 0) parents.push(it.parent);
          if (it.oldParent && parents.indexOf(it.oldParent) < 0) parents.push(it.oldParent);

          const enabled = oldParent === container.parent;
          if (!enabled) return;
          container.transform.updateTransform(container.parent.transform);
          newParent.addChild(container);
          transformTo(container, newParent);
          this.updateComponents(entity.components, container);
        });

        const pushParents = (source: string[]) => {
          if (source.length === 0) return;
          const pushed = [];
          source.forEach((id) => {
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

        parents.forEach((id) => {
          const container = this.getContainer(id);
          if (!container) return;
          const entity = this.sceneService.getEntity(id);
          if (entity.type === SceneEntityType.Layer) return;
          const parentContainer = this.getContainer(entity.parent) || this.scene;
          const enabled = container.parent === parentContainer;
          if (!enabled) return;
          const bounds: Rectangle = container.getLocalBounds();
          tempPoint.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
          if (container.parent) container.parent.toLocal(tempPoint, container, container.position);
          container.pivot.copyFrom(tempPoint);
          this.updateComponents(entity.components, container);
        });
      });

      const self = this;
      engine.addListener({
        onAddedEntities(...entities: SceneEntity[]) {
          entities.forEach(entity => {
            const child = new Container();
            child.name = entity.id;
            child.sortableChildren = true;
            self.pixiContainers[entity.id] = child;
            self.applyComponents(entity.components, child);
            self.scene.addChild(child);
            child.transform.updateTransform(self.scene.transform);
            self.updateComponents(entity.components, child);
            const parentContainer = self.pixiContainers[entity.parent];

            let parentEntity = entity;
            while (parentEntity) {
              const size = parentEntity.components.byId('transformation.size');
              if (size) size.id = 'transformation.size.tmp';
              parentEntity = self.sceneService.getEntity(parentEntity.parent);
            }

            if (!parentContainer || parentContainer === self.scene) return;
            parentContainer.addChild(child);
            transformTo(child, parentContainer);
            self.updateComponents(entity.components, child);
          });
          requestAnimationFrame(() => {
            engine.run();
            entities.forEach(entity => {
              let parentEntity = entity;
              while (parentEntity) {
                const size = parentEntity.components.byId('transformation.size.tmp') as SizeSceneComponent;
                if (size) size.id = 'transformation.size';
                if (self.pixiContainers[parentEntity.id])
                  self.updateComponents(parentEntity.components, self.pixiContainers[parentEntity.id]);
                parentEntity = self.sceneService.getEntity(parentEntity.parent);
              }
            });
          });
        },
        onRemovedEntities(...entities: SceneEntity[]) {
          entities.forEach(entity => {
            const children = self.sceneService.getChildren(entity.id, true);
            if (children.length > 0) engine.entities.remove.apply(engine.entities, children);
            const container = self.pixiContainers[entity.id];
            if (container.parent) {
              container.parent.removeChild(self.pixiContainers[entity.id]);
              let parentEntity = self.sceneService.getEntity(entity.parent);
              while (parentEntity) {
                self.updateComponents(parentEntity.components, self.pixiContainers[parentEntity.id]);
                parentEntity = self.sceneService.getEntity(parentEntity.parent);
              }
            }
            delete self.pixiContainers[entity.id];
          });
        },
      });
    });
  }

  set component(comp: SceneComponentView) {
    if (this._app) this._app.destroy();
    this.comp = comp;
    this._app = new Application({
      antialias: true,
      autoDensity: true,
      transparent: true,
      view: this.comp.ref.nativeElement.querySelector('canvas'),
    });
    this._app.stage.sortableChildren = true;
    this._app.stage.addChild(this.scene);
    this._app.stop();
    this.setSize(this.comp.width, this.comp.height);
    this.init$.next();
  }

  /**
   * @inheritdoc
   */
  get component(): SceneComponentView {
    return this.comp;
  }

  /**
   * @inheritdoc
   */
  setSize(width: number, height: number): void {
    if (!this._app) return;
    this.renderer.resize(width, height);
    this.resize$.next({ width, height });
    this.engineService.run();
  }

  /**
   * @inheritdoc
   */
  projectToScene(x: number, y: number) {
    return this.scene.toLocal(new Point(x, y));
  }

  createPreview(x: number, y: number, asset: Asset) {
    this.zone.runOutsideAngular(() => {
      this.sceneService.createEntity(x, y, asset).subscribe((entity) => {
        this._previewEntity = entity;
        delete this._previewEntity.parent;
        this._previewEntity.components.add({ id: 'sprite.animate', type: 'boolean', boolean: true, group: 'sprite' });
        this.engineService.engine.entities.add(this._previewEntity);
        this._previewEntity.components.add({
          id: 'index',
          type: 'index',
          index: maxBy(this.scene.children, (child) => child.zIndex).zIndex + 1,
        });
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

  containsPoint(id: string, point: IPointData): boolean {
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

  /**
   * Updates the given components by reading the pixi values from the given container.
   *
   * @param components The components to update.
   * @param container The container to get the pixi values from.
   */
  updateComponents(components: SceneComponentCollection<SceneComponent>, container: Container): void {
    if (!container) return;

    const position = components.byId('transformation.position') as PointSceneComponent;
    const size = components.byId('transformation.size') as SizeSceneComponent;
    const skew = components.byId('transformation.skew') as PointSceneComponent;
    const pivot = components.byId('transformation.pivot') as PointSceneComponent;
    const rotation = components.byId('transformation.rotation') as RangeSceneComponent;

    if (rotation) {
      rotation.value = container.rotation;
    }

    if (size) {
      size.width = container.width;
      size.height = container.height;
    }

    if (skew) {
      skew.x = container.skew.x;
      skew.y = container.skew.y;
    }

    if (position) {
      position.x = container.position.x;
      position.y = container.position.y;
    }

    if (pivot) {
      pivot.x = container.pivot.x;
      pivot.y = container.pivot.y;
    }
  }

  /**
   * Applies the scene component values to the given pixi container.
   *
   * @param components The components to apply.
   * @param container The pixi container.
   */
  applyComponents(components: SceneComponentCollection<SceneComponent>, container: Container): void {
    const position = components.byId('transformation.position') as PointSceneComponent;
    const size = components.byId('transformation.size') as SizeSceneComponent;
    const rotation = components.byId('transformation.rotation') as RangeSceneComponent;
    const skew = components.byId('transformation.skew') as PointSceneComponent;
    const pivot = components.byId('transformation.pivot') as PointSceneComponent;
    if (rotation) container.rotation = rotation.value;
    if (position) container.position.copyFrom(position);
    if (size) {
      container.width = size.width;
      container.height = size.height;
    }
    if (skew) container.skew.copyFrom(skew);
    if (pivot) container.pivot.copyFrom(pivot);
  }
}
