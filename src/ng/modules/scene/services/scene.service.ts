import { Injectable, InjectionToken, Inject, Component, ElementRef, Type } from '@angular/core';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { Asset } from 'common/asset';
import { SceneAssetConverterService } from './converter.service';
import { CreateEntity, SortEntity, DeleteEntity } from '../states/actions/entity.action';
import { SceneEntity, createTransformationComponents, SceneEntityData, SceneComponent } from 'common/scene';
import { Observable, from, of, Subscription } from 'rxjs';
import { SceneState } from '../states/scene.state';
import { mergeMap } from 'rxjs/operators';
import { SceneComponent as SceneComp } from '../components/scene/scene.component';
import { ISerializeContext } from 'common/interfaces/serialize-context.interface';
import { OnRead, OnWrite } from 'ng/decorators/serializer.decorator';
import { ResetScene } from '../states/actions/scene.action';
import { cloneDeep } from 'lodash';

export interface ISceneRenderer {
  /**
   * The scene component reference.
   * Use it to visualize your rendered data.
   */
  component: SceneComp;

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
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @return The coordinates in scene space.
   */
  projectToScene(x: number, y: number): { x: number; y: number };

  /**
   * Creates a preview at the given coordinates from the given asset.
   *
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param asset The asset to create the preview for.
   */
  createPreview(x: number, y: number, asset?: Asset, ...components: SceneComponent[]): void;

  /**
   * Updates the current preview at the given coordinates.
   *
   * @param x The x coordinate.
   * @param y The y coordinate.
   */
  updatePreview(x: number, y: number): void;

  /**
   * Removes the current preview.
   */
  removePreview(): void;

  /**
   * Disposes the renderer.
   * Does cleanup work for the render.
   */
  dispose(): void;
}

/**
 * Renderer which does nothing.
 */
export class NoopRenderer implements ISceneRenderer {
  component!: SceneComp;

  sceneService!: SceneService;

  projectToScene(x: number, y: number) {
    return { x, y };
  }

  setSize() {}

  createPreview(): void {}

  updatePreview() {}

  removePreview() {}

  dispose() {}
}

export const YAME_RENDERER = new InjectionToken<ISceneRenderer>('YAME_RENDERER', {
  providedIn: 'root',
  factory: () => new NoopRenderer(),
});

export interface ISceneRendererComponent<T extends HTMLElement> {
  readonly ref: ElementRef<T>;
}

@Component({
  template: `<canvas></canvas>`,
})
export class NoopSceneRendererComponent implements ISceneRendererComponent<HTMLCanvasElement> {
  constructor(public readonly ref: ElementRef<HTMLCanvasElement>) {}
}

export const YAME_RENDERER_COMPONENT = new InjectionToken<Type<ISceneRendererComponent<HTMLElement>>>(
  'Yame Renderer Component',
  {
    providedIn: 'root',
    factory: () => NoopSceneRendererComponent,
  }
);

/**
 * The scene service provides an interface to access entities in the scene and the renderer.
 */
@Injectable({ providedIn: 'root' })
export class SceneService {
  protected _entities: SceneEntity[] = [];
  protected idMapping: { [key: string]: SceneEntity } = {};
  protected childDeepMapping: { [key: string]: SceneEntity[] } = {};
  protected childFlatMapping: { [key: string]: SceneEntity[] } = {};
  protected subs: Subscription[] = [];

  constructor(
    @Inject(YAME_RENDERER) public readonly renderer: ISceneRenderer,
    public readonly store: Store,
    public readonly actions: Actions,
    protected converter: SceneAssetConverterService
  ) {
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

    this.subs.push(
      actions.pipe(ofActionSuccessful(CreateEntity, DeleteEntity)).subscribe((action: CreateEntity | DeleteEntity) => {
        this._entities = this.store.snapshot().scene.entities.slice() as SceneEntity[];
        const updates: string[] = [];
        if (action instanceof CreateEntity) {
          action.created.forEach(entity => {
            this.idMapping[entity.id] = entity;
            this.childDeepMapping[entity.id] = this._getChildren(entity.id, true);
            this.childFlatMapping[entity.id] = this._getChildren(entity.id, false);
            collectUpdates(entity, updates);
          });
        } else {
          action.deleted.forEach(it => {
            const entity = this.idMapping[it.id];
            if (!entity) return;
            collectUpdates(entity, updates);
            delete this.idMapping[it.id];
            delete this.childDeepMapping[it.id];
            delete this.childFlatMapping[it.id];
          });
        }
        updateEntities(updates);
      })
    );
    this.subs.push(
      actions.pipe(ofActionSuccessful(SortEntity)).subscribe(() => {
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
        children = [...children, ...this._getChildren(it.id)];
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
  createEntity(x: number, y: number, asset?: Asset, ...components: SceneComponent[]): Observable<SceneEntity> {
    const hasAsset = asset && asset instanceof Asset;
    const obs = hasAsset ? from(this.converter.get(asset)) : of([]);
    const parent = this.store.selectSnapshot(state => state.select).isolated as SceneEntity;
    const re = obs.pipe(
      mergeMap(data => {
        const entity = new SceneEntity();
        if (parent) entity.parent = parent.id;
        const comps = createTransformationComponents();
        // const point = this.renderer.projectToScene(x, y);
        comps[1].x = x;
        comps[1].y = y;

        entity.components.add.apply(entity.components, [...comps, ...data, ...cloneDeep(components)]);
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
  addEntity(x: number, y: number, asset?: Asset, ...components: SceneComponent[]): Observable<SceneState> {
    return this.createEntity(x, y, asset, ...components).pipe(
      mergeMap(entity => {
        return this.store.dispatch(new CreateEntity(entity));
      })
    );
  }

  /**
   * Returns the entity for the given id.
   *
   * @param entity An entity instance or its id.
   * @return The found entity.
   */
  getEntity(entity: string | SceneEntity | null | undefined): SceneEntity | null | undefined {
    if (entity === null || entity === void 0) return void 0;
    const id = entity instanceof SceneEntity ? entity.id : entity;
    const re = this.idMapping[id];
    if (!re) return this.store.selectSnapshot(state => state.scene.entities).find((it: SceneEntity) => it.id === id);
    return re;
  }

  /**
   * Asserts that the given entity exists.
   *
   * @param entity The entity to check.
   * @return Whether the given entity exists in the store.
   */
  assertEntity(entity?: SceneEntity | string | null): boolean {
    return entity === void 0 || entity === null ? false : !!this.getEntity(entity);
  }

  /**
   * Returns all children for the given entity.
   * Note, that by default a deep scan is done.
   *
   * @param entityOrId The entity or the id.
   * @param [deep = true] Whether to return also the children of the children.
   * @return A list of scene entity children for the given id.
   */
  getChildren(entityOrId?: string | SceneEntity | null, deep: boolean = true): SceneEntity[] {
    const id = entityOrId instanceof SceneEntity ? entityOrId.id : entityOrId;
    const re = deep ? this.childDeepMapping[id as string] : this.childFlatMapping[id as string];
    if (re === void 0) return this._getChildren(entityOrId as string, deep);
    else return re;
  }

  /**
   * Creates a preview for the given asset at the given coordinates.
   *
   * @param x The x value for the position.
   * @param y The y value for the position.
   * @param asset The asset to create the preview for.
   */
  createPreview(x: number, y: number, asset?: Asset, ...components: SceneComponent[]): void {
    this.renderer.createPreview(x, y, asset, ...components);
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

  /**
   * Exports the current scene entities as plain objects in the given context.
   *
   * @param context Any export context.
   */
  async export(context: ISerializeContext): Promise<SceneEntityData[]> {
    const entities = await Promise.all(this.entities.map(entity => entity.export(context)));

    const getParentCount = (entity: SceneEntityData) => {
      let parent = entity.parent;
      let count = 0;
      while (parent) {
        ++count;
        const found = entities.find(it => it.id === parent);
        parent = found ? found.parent : null;
      }
      return count;
    };
    entities.sort((a, b) => getParentCount(a) - getParentCount(b));

    return entities;
  }

  /**
   * Imports the given entities in the given context.
   *
   * @param entities Scene entity data to import into the scene.
   * @param context Any import context.
   */
  async import(entities: SceneEntityData[], context: ISerializeContext): Promise<SceneEntity[]> {
    const newEntities = await Promise.all(
      entities.map(async data => {
        const entity = await SceneEntity.import(data, context);
        entity.components.set({ id: 'copy-descriptor', type: 'copy-data', ref: entity.id });
        return entity;
      })
    );
    const getParentCount = (entity: SceneEntity) => {
      let parent = entity.parent;
      let count = 0;
      while (parent) {
        ++count;
        const found = newEntities.find(it => it.id === parent);
        parent = found ? found.parent : null;
      }
      return count;
    };
    newEntities.sort((a, b) => getParentCount(a) - getParentCount(b));
    return newEntities;
  }

  @OnWrite('entities')
  async write(context: ISerializeContext): Promise<SceneEntityData[]> {
    return this.export(context);
  }

  @OnRead('entities')
  async read(data: SceneEntityData[], context: ISerializeContext): Promise<SceneEntity[]> {
    const entities = await this.import(data, context);
    await this.store.dispatch(new ResetScene()).toPromise();
    await this.store.dispatch(new CreateEntity(entities)).toPromise();
    return entities;
  }
}
