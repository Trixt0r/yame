import { Injectable, Inject } from '@angular/core';
import { SelectionToolService } from 'ng/module/toolbar/tools/selection';
import { PixiRendererService } from '../renderer.service';
import { Container, Rectangle, Point, Transform, Matrix } from 'pixi.js';
import { Subject, Observable } from 'rxjs';
import { SceneEntity, SceneComponent, PointSceneComponent, RangeSceneComponent, createTransformationComponents } from 'common/scene';
import { YAME_RENDERER, UpdateComponents } from 'ng/module/scene';
import { SceneComponentCollection } from 'common/scene/component.collection';
import { Store } from '@ngxs/store';
import { merge, isEqual, maxBy } from 'lodash';
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

  /**
   * Updates the components based on the current entities.
   */
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
    this.pixi.updateComponents(this.components, this.container);
  }

  /**
   * Applies the scene components to the actual pixi transformation values.
   */
  applyComponents(): void {
    this.pixi.applyComponents(this.components, this.container);
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
   * Updates the container, based on the current selection.
   */
  updateContainer(): void {
    this.container.setTransform(0, 0, 1, 1, 0, 0, 0, 0, 0);
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
    this.container.transform.updateTransform(this.container.parent.transform);

    this.updateComponents();
  }

  /**
   * Selects the given entities.
   * Adds them to this container, applies the correct transformation and preserves the parent relation.
   *
   * @param entities The entities to add.
   * @param silent Whether to skip the subject notification.
   * @returns The added entities.
   */
  select(entities: SceneEntity[], silent = false) {
    const added: SceneEntity[] = [];

    this.entities.forEach(entity => {
      const child = this.pixi.getContainer(entity.id);
      const parentContainer = this.pixi.getContainer(entity.parent) || this.pixi.scene;
      parentContainer.addChild(child);
      transformTo(child, parentContainer);
    });
    this.container.zIndex = maxBy(this.pixi.scene.children, (child) => child.zIndex).zIndex + 1;
    this.pixi.scene.addChild(this.container);

    entities.forEach((entity) => {
      const found = this.entities.indexOf(entity);
      if (found >= 0) return console.warn(`[SelectionContainer] Entity with id ${entity.id} is already selected!`);
      this.entities.push(entity);
      added.push(entity);
    });

    this.entities.forEach((entity, i) => {
      entity.components.add(this.comp);
      this.pixi.getContainer(entity.id).zIndex = i;
      this.container.addChild(this.pixi.getContainer(entity.id));
    });

    this.updateContainer();

    if (added.length > 0 && !silent) this.selected$.next(added);

    return added;
  }

  /**
   * Unselects the given entities, i.e. removes them from this container.
   * Makes sure to restore each entity to their original parent with the correct transformation.
   *
   * @param entities The entities to remove.
   * @param silent Whether to skip the subject notification.
   * @returns The removed entities.
   */
  unselect(entities: SceneEntity[] = this.entities.slice(), silent = false): SceneEntity[] {
    if (this.handling) this.endHandling(this.currentHandler);
    const toRemove = entities.filter((child) => this.entities.indexOf(child) >= 0);
    const hadOnlyOne = this.entities.length === 1;
    const first = this.entities[0];
    entities.forEach(entity => {
      if (toRemove.indexOf(entity) < 0)
        return console.warn(
          `[SelectionContainer] You are trying to remove a child ${entity.id} which is not part of this container!`
        );
      const idx = this.entities.indexOf(entity);
      if (idx >= 0) {
        this.entities.splice(idx, 1);
        entity.components.remove(this.comp);
      }
      const child = this.pixi.getContainer(entity.id);
      child.transform.updateTransform(this.container.transform);
      // Restore the internal relation
      const parentContainer = this.pixi.getContainer(entity.parent) || this.pixi.scene;
      parentContainer.addChild(child);
      // And apply the proper transformation values
      if (hadOnlyOne && entity === first) child.pivot.copyFrom(this.container.pivot);
      transformTo(child, parentContainer);
      this.pixi.updateComponents(entity.components, child);
    });
    if (this.entities.length === 0) this.container.interactive = false;
    if (toRemove.length > 0 && !silent) this.unselected$.next(toRemove);
    if (!this.container.interactive) this.pixi.scene.removeChild(this.container);
    else this.updateContainer();
    return toRemove;
  }
}
