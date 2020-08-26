import { Injectable, InjectionToken, Inject, Component, ElementRef, Type } from '@angular/core';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { Asset } from 'common/asset';
import { SceneAssetConverterService } from './converter.service';
import { CreateEntity, SortEntity, DeleteEntity } from '../states/actions/entity.action';
import { SceneEntity, createTransformationComponents } from 'common/scene';
import { Observable, from, of, Subscription } from 'rxjs';
import { SceneState } from '../states/scene.state';
import { flatMap } from 'rxjs/operators';
import { SceneComponent } from '../components';

export interface ISceneRenderer {

  /**
   * The scene component reference.
   * Use it to visualize your rendered data.
   */
  component: SceneComponent;

  /**
   * The scene service reference.
   */
  sceneService: SceneService;

  /**
   * Sets the size of the renderer.
   *
   * @param width
   * @param height
   */
  setSize(width: number, height: number): void;

  /**
   * Projects the given global coordinates to scene space.
   *
   * @param x The x coordinate
   * @param y The y coordinate
   * @return { { x: number, y: number } } The coordinates in scene space.
   */
  projectToScene(x: number, y: number): { x: number, y: number };

  createPreview(x: number, y: number, asset: Asset);

  updatePreview(x: number, y: number): void;

  removePreview(): void;

  dispose(): void;
}

/**
 * Renderer which does nothing.
 */
export class NoopRenderer implements ISceneRenderer {

  component: SceneComponent;

  sceneService: SceneService;

  projectToScene(x: number, y: number) { return { x, y }; }

  setSize(width: number, height: number) { }

  createPreview(x: number, y: number, asset: Asset) { return null; }

  updatePreview(x: number, y: number) { }

  removePreview() { };

  dispose() { };
}

export const YAME_RENDERER = new InjectionToken<ISceneRenderer>('Yame Renderer', {
  providedIn: 'root',
  factory: () => new NoopRenderer()
});

export interface ISceneRendererComponent<T extends HTMLElement> {
  readonly ref: ElementRef<T>;
}

@Component({
  template: `<canvas></canvas>`
})
export class NoopSceneRendererComponent implements ISceneRendererComponent<HTMLCanvasElement> {
  constructor(public readonly ref: ElementRef<HTMLCanvasElement>) { }
}

export const YAME_RENDERER_COMPONENT = new InjectionToken<Type<ISceneRendererComponent<HTMLElement>>>('Yame Renderer Component', {
  providedIn: 'root',
  factory: () => NoopSceneRendererComponent
});

/**
 * The scene service provides an interface to access entities in the scene and the renderer.
 */
@Injectable({ providedIn: 'root' })
export class SceneService {

  protected _entities: SceneEntity[] = [];
  protected idMapping: { [key: string]: SceneEntity } = { };
  protected childDeepMapping: { [key: string]: SceneEntity[] } = { };
  protected childFlatMapping: { [key: string]: SceneEntity[] } = { };
  protected subs: Subscription[] = [];


  constructor(
    @Inject(YAME_RENDERER) public readonly renderer: ISceneRenderer,
    @Inject(YAME_RENDERER_COMPONENT) public readonly rendererComponent: Type<ISceneRendererComponent<HTMLElement>>,
    protected store: Store,
    protected actions: Actions,
    protected converter: SceneAssetConverterService) {
      renderer.sceneService = this;
      const collectUpdates = (entity: SceneEntity, target: string[]) => {
        let parent = this.getEntity(entity.parent);
        while (parent) {
          if (target.indexOf(parent.id) < 0) target.push(parent.id);
          parent = parent.parent ? this.getEntity(parent.parent) : null;
        }
      };

      const updateEntities = (ids: string[]) => {
        ids.forEach(id => {
          this.childDeepMapping[id] = this._getChildren(id, true);
          this.childFlatMapping[id] = this._getChildren(id, false);
        });
      };

      this.subs.push(actions.pipe(ofActionSuccessful(CreateEntity, DeleteEntity))
        .subscribe((action: CreateEntity | DeleteEntity) => {
          this._entities = this.store.snapshot().scene.entities.slice() as SceneEntity[];
          const updates: string[] = [];
          if (action instanceof CreateEntity) {
            const newEntities = Array.isArray(action.data) ? action.data : [action.data];
            newEntities.forEach(entity => {
              this.idMapping[entity.id] = entity;
              this.childDeepMapping[entity.id] = this._getChildren(entity.id, true);
              this.childFlatMapping[entity.id] = this._getChildren(entity.id, false);
              collectUpdates(entity, updates);
            });
          } else {
            const removed = Array.isArray(action.id) ? action.id : [action.id];
            removed.forEach(id => {
              const entity = this.idMapping[id];
              collectUpdates(entity, updates);
              delete this.idMapping[id];
              delete this.childDeepMapping[id];
              delete this.childFlatMapping[id];
            });
          }
          updateEntities(updates);
        }));
    this.subs.push(
      actions.pipe(ofActionSuccessful(SortEntity))
        .subscribe((action: SortEntity) => {
          const data = Array.isArray(action.data) ? action.data : [action.data];
          this._entities = this.store.snapshot().scene.entities.slice();
          this.entities.forEach(it => {
            this.childDeepMapping[it.id] = this._getChildren(it.id, true);
            this.childFlatMapping[it.id] = this._getChildren(it.id, false);
          });
        })
    );
  }

  /**
   * A flat list of all entities in the scene.
   */
  get entities(): readonly SceneEntity[] {
    return this._entities;
  }

  /**
   * Settings for the scene.
   */
  get settings(): any {
    return this.store.snapshot().scene.settings;
  }

  /**
   * Returns all children for the given entity.
   * Note, that by default a deep scan is done.
   *
   * @param entityOrId The entity or the id.
   * @param [deep = true] Whether to return also the children of the children.
   * @return A list of scene entity children for the given id.
   */
  protected _getChildren(entityOrId: string | SceneEntity, deep: boolean = true): SceneEntity[] {
    const id = entityOrId instanceof SceneEntity ? entityOrId.id : entityOrId;
    let children = this._entities.filter(entity => entity.parent === id);
    if (deep) {
      children.slice().forEach(it => {
        children = [
          ...children,
          ...this._getChildren(it.id),
        ];
      });
    }
    return children;
  }

  /**
   * Sets the width and height of the renderer.
   *
   * @param width
   * @param height
   */
  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  /**
   * Creates a loosely coupled entity from the given asset at the given coordinates.
   *
   * Calling this method will give the entity transformation components.
   * The provided coordinates will be used for the position.
   *
   * Note, that this method won't add the created entity to the scene state.
   *
   * @param x The x value for the position.
   * @param y The y value for the position.
   * @param asset The asset to create the entity from.
   * @return An observable, you can subscribe to.
   */
  createEntity(x: number, y: number, asset?: Asset): Observable<SceneEntity> {
    const hasAsset = asset instanceof Asset;
    const obs = hasAsset ? from(this.converter.get(asset)) : of([]);
    const parent = this.store.selectSnapshot(state => state.select).isolated as SceneEntity;
    const re = obs.pipe(
      flatMap(data => {
        const entity = new SceneEntity();
        if (parent) {
          entity.parent = parent.id;
          parent.children.push(entity.id);
        }
        const comps = createTransformationComponents();
        const point = this.renderer.projectToScene(x, y);
        comps[1].x = point.x;
        comps[1].y = point.y;

        const components = [...comps, ...data];
        entity.components.add.apply(entity.components, components);
        return of(entity);
      })
    );
    if (!hasAsset) re.subscribe();
    return re;
  }

  /**
   * Adds an entity for the given asset at the given position.
   *
   * @param x The x value for the position.
   * @param y The y value for the position.
   * @param asset The asset to create the entity from.
   * @return An observable, you can subscribe to.
   */
  addEntity(x: number, y: number, asset?: Asset): Observable<SceneState> {
    return this.createEntity(x, y, asset).pipe(flatMap(entity => {
      return this.store.dispatch(new CreateEntity(entity));
    }));
  }

  /**
   * Returns the entity for the given id.
   *
   * @param entity An entity instance or its id.
   * @return The found entity.
   */
  getEntity(entity: string | SceneEntity): SceneEntity {
    const id = entity instanceof SceneEntity ? entity.id : entity;
    const re = this.idMapping[id];
    if (!re) return this.store.selectSnapshot(state => state.scene.entities).find(it => it.id === id);
    return re;
  }

  /**
   * Asserts that the given entity exists.
   *
   * @param entity The entity to check.
   * @return Whether the given entity exists in the store.
   */
  assertEntity(entity: SceneEntity | string): boolean {
    return !!this.getEntity(entity);
  }

  /**
   * Returns all children for the given entity.
   * Note, that by default a deep scan is done.
   *
   * @param entityOrId The entity or the id.
   * @param [deep = true] Whether to return also the children of the children.
   * @return A list of scene entity children for the given id.
   */
  getChildren(entityOrId: string | SceneEntity, deep: boolean = true): SceneEntity[] {
    const id = entityOrId instanceof SceneEntity ? entityOrId.id : entityOrId;
    const re = deep ? this.childDeepMapping[id] : this.childFlatMapping[id];
    if (re === void 0) return this._getChildren(entityOrId, deep);
    else return re;
  }

  /**
   * Creates a preview for the given asset at the given coordinates.
   *
   * @param x The x value for the position.
   * @param y The y value for the position.
   * @param asset The asset to create the preview for.
   */
  createPreview(x: number, y: number, asset: Asset): void {
    this.renderer.createPreview(x, y, asset);
  }

  /**
   * Updates the position for the preview.
   *
   * @param x The x value for the position.
   * @param y The y value for the position.
   */
  updatePreview(x: number, y: number): void {
    this.renderer.updatePreview(x, y);
  }

  /**
   * Removes the current preview.
   */
  removePreview(): void {
    this.renderer.removePreview();
  }

  /**
   * Disposes this service and its dependencies.
   */
  dispose(): void {
    this.subs.forEach(sub => sub.unsubscribe());
    this.renderer.dispose();
  }
}
