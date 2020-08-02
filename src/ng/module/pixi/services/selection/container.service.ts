import { Injectable, Inject } from '@angular/core';
import { SelectionToolService } from 'ng/module/toolbar/tools/selection';
import { PixiRendererService } from '../renderer.service';
import { Container, Rectangle, Point, Transform } from 'pixi.js';
import { Subject, Observable } from 'rxjs';
import { SceneEntity, SceneComponent, PointSceneComponent, RangeSceneComponent, createTransformationComponents } from 'common/scene';
import { YAME_RENDERER, UpdateComponents } from 'ng/module/scene';
import { SceneComponentCollection } from 'common/scene/component.collection';
import { Store } from '@ngxs/store';

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
  readonly transformationComps: SceneComponent[];

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
    protected selection: SelectionToolService,
    @Inject(YAME_RENDERER) public readonly pixi: PixiRendererService,
    protected store: Store,
  ) {
    this.transformationComps = createTransformationComponents()
    this.components.add.apply(this.components, this.transformationComps);

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
    let comps = [];
    // if (this.entities.length === 1)
      comps = this.entities[0].components.filter(it => it.id.indexOf('transformation') < 0);
    this.components.set.apply(this.components, this.transformationComps.concat(comps));

    const position = this.components.byId('transformation.position') as PointSceneComponent;
    const scale = this.components.byId('transformation.scale') as PointSceneComponent;
    const rotation = this.components.byId('transformation.rotation') as RangeSceneComponent;
    const skew = this.components.byId('transformation.skew') as PointSceneComponent;
    const pivot = this.components.byId('transformation.pivot') as PointSceneComponent;

    rotation.value = this.container.rotation;
    position.x = this.container.position.x;
    position.y = this.container.position.y;
    scale.x = this.container.scale.x;
    scale.y = this.container.scale.y;
    skew.x = this.container.skew.x;
    skew.y = this.container.skew.y;
    pivot.x = this.container.pivot.x;
    pivot.y = this.container.pivot.y;
  }

  applyComponents() {
    const position = this.components.byId('transformation.position') as PointSceneComponent;
    const scale = this.components.byId('transformation.scale') as PointSceneComponent;
    const rotation = this.components.byId('transformation.rotation') as RangeSceneComponent;
    const skew = this.components.byId('transformation.skew') as PointSceneComponent;
    const pivot = this.components.byId('transformation.pivot') as PointSceneComponent;
    this.container.rotation = rotation.value;
    this.container.position.copyFrom(position);
    this.container.scale.copyFrom(scale);
    this.container.skew.copyFrom(skew);
    this.container.pivot.copyFrom(pivot);
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
   * @return The added entities.
   */
  select(entities: SceneEntity[], silent = false) {
    const added: SceneEntity[] = [];
    // const tmpRot = this.container.rotation;
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

    this.entities.forEach((entity) => {
      entity.components.add(this.comp);
      const entityContainer = this.pixi.getContainer(entity.id);
      const parentContainer = this.pixi.getContainer(entity.parent) || this.pixi.scene;
      this.container.toLocal(entityContainer.position, parentContainer, entityContainer.position);
      this.container.addChild(entityContainer);
    });

    if (this.entities.length > 0) {
      this.container.interactive = true;
      let bounds: Rectangle;
      if (this.container.parent && this.entities.length > 1) {
        bounds = this.container.getLocalBounds();
        const pivotX = bounds.x + bounds.width / 2;
        const pivotY = bounds.y + bounds.height / 2;
        this.container.parent.toLocal(new Point(pivotX, pivotY), this.container, this.container.position);
        this.container.pivot.set(pivotX, pivotY);
      } else {
        const child = this.pixi.getContainer(this.entities[0].id);
        // Copy the transformation over
        this.container.rotation = child.rotation;
        this.container.position.copyFrom(child.position);
        this.container.scale.copyFrom(child.scale);
        this.container.skew.copyFrom(child.skew);
        this.container.pivot.copyFrom(child.pivot);
        // And set the identity transformation on the child
        child.position.copyFrom(child.pivot);
        this.container.toLocal(child.position, child, child.position);
        child.scale.set(1, 1);
        child.skew.set(0, 0);
        child.rotation = 0;
        // Now we have the correct bounds
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
   * @return The removed entities.
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
