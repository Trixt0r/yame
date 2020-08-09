import { Injectable, Inject } from '@angular/core';
import { SelectionToolService } from 'ng/module/toolbar/tools/selection';
import { PixiRendererService } from '../renderer.service';
import { Container, Rectangle, Point, Transform, Matrix } from 'pixi.js';
import { Subject, Observable } from 'rxjs';
import { SceneEntity, SceneComponent, PointSceneComponent, RangeSceneComponent, createTransformationComponents } from 'common/scene';
import { YAME_RENDERER, UpdateComponents } from 'ng/module/scene';
import { SceneComponentCollection } from 'common/scene/component.collection';
import { Store } from '@ngxs/store';
import { merge, isEqual } from 'lodash';
import { transformTo } from '../../utils/transform.utils';

@Injectable({ providedIn: 'root' })
export class PixiSelectionContainerService {

  /**
   * Whether events are currently being handled or not.
   */
  protected handling = false;

  /**
   * The current handler reference.
   */
  protected handlerRef: unknown;

  protected comp: SceneComponent = { id: 'transform-off', type: 'selection-container' };

  protected updateAction = new UpdateComponents([]);

  readonly entities: SceneEntity[] = [];

  readonly container = new Container();

  readonly handleBegin$ = new Subject<unknown[]>();
  readonly handleEnd$ = new Subject<unknown[]>();
  readonly selected$ = new Subject<SceneEntity[]>();
  readonly unselected$ = new Subject<SceneEntity[]>();
  readonly update$ = new Subject();
  readonly components = new SceneComponentCollection();

  /**
   * Whether user events handled via this container.
   */
  get isHandling(): boolean {
    return this.handling;
  }

  /**
   * The current handler.
   */
  get currentHandler(): any {
    return this.handlerRef;
  }

  constructor(
    @Inject(YAME_RENDERER) public readonly pixi: PixiRendererService,
    protected selection: SelectionToolService,
    protected store: Store,
  ) {
    this.update$.subscribe(() => this.updateComponents());
  }

  /**
   * Begins handling user events with the given reference and arguments.
   * Call this if you are handling events for a specific action which has to be blocked for others.
   *
   * @param ref Your reference, e.g. your instance handling the current user events.
   * @param args Any additional arguments.
   */
  beginHandling(ref: unknown, ...args: unknown[]): void {
    if (this.handling) throw new Error('beginHandling has already been called. endHandling has to be called before!');
    this.handlerRef = ref;
    this.handling = true;
    this.handleBegin$.next(args);
  }

  /**
   * Ends handling the user events, started with the given reference.
   * An error will be thrown if you call this method with a reference different from the one in beginHandling or if no
   * events are handled at all right now.
   *
   * @param ref The reference, you called beginHandling with.
   * @param args Any additional arguments.
   */
  endHandling(ref: unknown, ...args: unknown[]) {
    if (!this.handling) throw new Error('beginHandling has to be called before!');
    if (ref !== this.handlerRef)
      throw new Error(
        'You are not allowed to call this,' + ' since the handling was not started by the given reference'
      );
    this.handlerRef = null;
    this.handling = false;
    this.handleEnd$.next(args);
  }

  updateComponents(): void {
    this.components.clear();
    const comps = [];
    const ids: { [ id: string ]: { comp: SceneComponent, entities: SceneEntity[] } } = { };
    this.entities.forEach(entity => {
      entity.components.forEach(comp => {
        if (!ids[comp.id]) ids[comp.id] = { comp: comp, entities: [] };
        if (ids[comp.id].comp.type !== comp.type) return;
        ids[comp.id].entities.push(entity);
      });
    });

    Object.keys(ids).forEach(key => {
      const data = ids[key];
      if (data.entities.length !== this.entities.length) return;
      const notEqual = !!data.entities.find(it => !isEqual(it.components.byId(key), data.comp));
      const mixed = key.indexOf('transformation') < 0 && notEqual;
      comps.push(merge({}, data.comp, { mixed }));
    });

    this.components.set.apply(this.components, comps);

    const position = this.components.byId('transformation.position') as PointSceneComponent;
    const scale = this.components.byId('transformation.scale') as PointSceneComponent;
    const rotation = this.components.byId('transformation.rotation') as RangeSceneComponent;
    const skew = this.components.byId('transformation.skew') as PointSceneComponent;
    const pivot = this.components.byId('transformation.pivot') as PointSceneComponent;

    if (rotation) rotation.value = this.container.rotation;

    if (position) {
      position.x = this.container.position.x;
      position.y = this.container.position.y;
    }

    if (scale) {
    scale.x = this.container.scale.x;
    scale.y = this.container.scale.y;
    }

    if (skew) {
      skew.x = this.container.skew.x;
      skew.y = this.container.skew.y;
    }

    if (pivot) {
      pivot.x = this.container.pivot.x;
      pivot.y = this.container.pivot.y;
    }
  }

  applyComponents() {
    const position = this.components.byId('transformation.position') as PointSceneComponent;
    const scale = this.components.byId('transformation.scale') as PointSceneComponent;
    const rotation = this.components.byId('transformation.rotation') as RangeSceneComponent;
    const skew = this.components.byId('transformation.skew') as PointSceneComponent;
    const pivot = this.components.byId('transformation.pivot') as PointSceneComponent;
    if (rotation) this.container.rotation = rotation.value;
    if (position) this.container.position.copyFrom(position);
    if (scale) this.container.scale.copyFrom(scale);
    if (skew) this.container.skew.copyFrom(skew);
    if (pivot) this.container.pivot.copyFrom(pivot);
  }

  /**
   * Dispatches a scene component update action on the store.
   *
   * @param components The updated scene components.
   * @returns An observable to subscribe to.
   */
  dispatchUpdate(...components: SceneComponent[]): Observable<any> {
    this.update$.next();
    this.updateAction.components = components;
    return this.store.dispatch(this.updateAction);
  }

  /**
   * Selects the given entities, i.e. adds them to this container.
   * This happens without changing the parent entity reference.
   *
   * An already selected entity won't be added to the selection.
   * An entity is considered selected if it is part of this container.
   *
   * Emits the `selected` event with the added entities.
   * Each newly selected entity will also emit the `selected` event with the selection container reference as an arg.
   *
   * @param entities The entities to add.
   * @param silent Whether to skip the subject notification.
   * @returns The added entities.
   */
  select(entities: SceneEntity[], silent = false) {
    const added: SceneEntity[] = [];
    const tmp = this.entities.slice();
    this.unselect(this.entities, true);
    tmp.forEach((it) => this.entities.push(it));
    this.container.rotation = 0;
    this.container.position.set(0, 0);
    this.container.scale.set(1, 1);
    this.container.skew.set(0, 0);
    this.container.pivot.set(0, 0);
    this.pixi.scene.addChild(this.container);

    entities.forEach((entity) => {
      const found = this.entities.indexOf(entity);
      if (found >= 0) return console.warn(`[SelectionContainer] Entity with id ${entity.id} is already selected!`);
      this.entities.push(entity);
      added.push(entity);
    });

    this.entities.forEach(entity => {
      entity.components.add(this.comp);
      this.container.addChild(this.pixi.getContainer(entity.id));
    });

    if (this.entities.length > 0) {
      this.container.interactive = true;
      let bounds: Rectangle;
      if (this.container.parent && this.entities.length > 1) {
        this.entities.forEach(entity => {
          transformTo(this.pixi.getContainer(entity.id), this.container.parent);
        });
        bounds = this.container.getLocalBounds();
        const pivotX = bounds.x + bounds.width / 2;
        const pivotY = bounds.y + bounds.height / 2;
        this.container.parent.toLocal(new Point(pivotX, pivotY), this.container, this.container.position);
        this.container.pivot.set(pivotX, pivotY);
      } else {
        // Apply the transformation of the child directly to the container
        const child = this.pixi.getContainer(this.entities[0].id);
        transformTo(child, this.container.parent);
        this.container.transform.setFromMatrix(child.localTransform);
        this.container.pivot.copyFrom(child.pivot);
        // The child has to have no transformation, i.e. identity matrix
        child.transform.setFromMatrix(Matrix.IDENTITY);
        child.pivot.set(0, 0); // Needed, since above line is not resetting the pivot coordinates
        bounds = this.container.getLocalBounds();
      }
      this.container.hitArea = bounds;
    }

    this.updateComponents();

    if (added.length > 0 && !silent) this.selected$.next(added);

    return added;
  }

  /**
   * Unselects the given entities, i.e. removes them from this container.
   * Makes sure to restore each entity to their original parent.
   *
   * Emits the `unselected` event with the removed entities.
   * Each unselected entity will also emit the `unselected` event with the selection container reference as an arg.
   *
   * @param entities The entities to remove. By default all currently selected entities will be removed.
   * @param silent Whether to skip the subject notification.
   * @returns The removed entities.
   */
  unselect(entities: SceneEntity[] = this.entities.slice(), silent = false): SceneEntity[] {
    if (this.handling) this.endHandling(this.currentHandler);
    const toRemove = entities.filter((child) => this.entities.indexOf(child) >= 0);
    entities.forEach((entity) => {
      if (toRemove.indexOf(entity) < 0)
        return console.warn(
          '[SelectionContainer] You are trying to remove a child ' + 'which is not part of this container!'
        );
      const child = this.pixi.getContainer(entity.id);
      this.container.removeChild(child);
      const idx = this.entities.indexOf(entity);
      if (idx >= 0) {
        this.entities.splice(idx, 1);
        entity.components.remove(this.comp);
      }
      // Restoring the internal relation and transformation
      const parentContainer = this.pixi.getContainer(entity.parent) || this.pixi.scene;

      const mat = parentContainer.worldTransform.clone().invert().append(child.worldTransform.clone());
      const transform = new Transform();
      mat.decompose(transform);

      child.scale.copyFrom(transform.scale);
      child.rotation = transform.rotation;
      child.skew.copyFrom(transform.skew);

      // Note, that the position is not extracted from the decomposed transform, due to pivot issues
      parentContainer.toLocal(child.position, this.container, child.position);
      parentContainer.addChild(child);
    });
    if (this.entities.length === 0) this.container.interactive = false;
    if (toRemove.length > 0 && !silent) this.unselected$.next(toRemove);
    if (!this.container.interactive) this.pixi.scene.removeChild(this.container);
    return toRemove;
  }
}
