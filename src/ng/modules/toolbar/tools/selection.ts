import { Tool } from '../tool';
import { Injectable } from '@angular/core';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { Select, Unselect, SceneService } from 'ng/modules/scene';
import { SceneComponent, SceneEntity, SceneEntityType } from 'common/scene';
import { Keydown } from 'ng/states/hotkey.state';
import { CursorService } from 'ng/services/cursor.service';

/**
 *
 * Configuration interface for the selection tool.
 */
export interface SelectionToolConfig {
  fill?: { alpha?: number; color?: number };
  line?: { width?: number; color?: number; alpha?: number };
}

/**
 * The selection tool service registers itself as a tool in the toolbar and
 * allows the renderer to handle user input.
 */
@Injectable({ providedIn: 'root' })
export class SelectionToolService extends Tool {
  /**
   * The configuration for this tool.
   */
  config: SelectionToolConfig = { fill: {}, line: {} };

  /**
   * The handlers of the selection container.
   */
  readonly handlers: any[] = [];

  protected down = false;

  // Context bound mouse event handler.
  protected onMousedown!: (event: MouseEvent) => void;
  protected onMouseup!: (event: MouseEvent) => void;
  protected onMousemove!: (event: MouseEvent) => void;

  protected selectAction = new Select([], []);
  protected unselectAction = new Unselect();

  readonly begin$ = new Subject<MouseEvent>();
  readonly update$ = new Subject<MouseEvent>();
  readonly end$ = new Subject<MouseEvent>();

  handledByExternal = false;

  constructor(
    protected store: Store,
    protected scene: SceneService,
    protected cursor: CursorService,
    actions: Actions
  ) {
    super('edit', 'select', 0);
    this.initFunctions();

    actions.pipe(ofActionSuccessful(Keydown)).subscribe((action: Keydown) => {
      if (action.shortcut.id !== 'select.all') return;
      const all = scene.entities
        .filter(it => it.type !== SceneEntityType.Layer && this.isSelectable(it))
        .map(it => it.id);
      if (all.length === 0) return;
      this.store.dispatch(new Select(all, []));
    });
  }

  /**
   * Initializes the mouse handler functions, if not done yet.
   */
  protected initFunctions(): void {
    if (!this.onMousedown) this.onMousedown = this.mousedown.bind(this);
    if (!this.onMouseup) this.onMouseup = this.mouseup.bind(this);
    if (!this.onMousemove) this.onMousemove = this.mousemove.bind(this);
  }

  /**
   * Returns whether the given entity is selectable or not.
   *
   * @param entity The entity to check.
   * @param fromHierarchy Whether comes from the hierarchy component or not.
   * @return `true` if selectable.
   */
  isSelectable(entity: SceneEntity, fromHierarchy = false): boolean {
    const isolated = this.store.selectSnapshot(state => state.select).isolated;
    const parent = entity.parent ? this.scene.getEntity(entity.parent) : null;
    const isOnLayer = parent ? parent.type === SceneEntityType.Layer : false;
    return isolated
      ? this.scene.getChildren(isolated).some(it => it.id === entity.id)
      : !entity.parent || isOnLayer || (fromHierarchy && entity.type !== SceneEntityType.Layer);
  }

  /**
   * Dispatches the select action.
   *
   * @param entities The ids of the entities to select.
   * @param components The components to be selected.
   * @return An observable to subscribe to.
   */
  dispatchSelect(entities: string[], components: SceneComponent[]): Observable<void> {
    this.selectAction.components = components;
    this.selectAction.entities = entities;
    return this.store.dispatch(this.selectAction);
  }

  /**
   * Adds the mouse handlers to the canvas element.
   */
  addToolListeners(): void {
    setImmediate(() => this.scene.renderer.component.ref.nativeElement.addEventListener('mousedown', this.onMousedown));
  }

  /**
   * Removes the mouse listeners from the canvas element.
   */
  removeToolListeners(): void {
    this.cursor.end();
    this.scene.renderer.component.ref.nativeElement.removeEventListener('mousedown', this.onMousedown);
  }

  /**
   * The mousedown handler.
   *
   * @param event
   */
  mousedown(event: MouseEvent): void {
    if (this.handledByExternal) return; // Delegate the work to the current container
    if (event.which !== 1) return;
    if (this.down) return;
    this.down = true;
    window.addEventListener('mouseup', this.onMouseup);
    window.addEventListener('mousemove', this.onMousemove);
    this.unselectAction.entities = this.store.selectSnapshot(state => state.select).entities;
    if ((this.unselectAction.entities?.length || 0) > 0) this.store.dispatch(this.unselectAction);
    this.begin$.next(event);
  }

  /**
   * The mouseup handler.
   *
   * @param event
   */
  mouseup(event: MouseEvent): void {
    if (!this.down) return;
    if (event.which !== 1) return;
    this.down = true;
    this.finish(event);
    window.removeEventListener('mouseup', this.onMouseup);
    window.removeEventListener('mousemove', this.onMousemove);
  }

  /**
   * The mousemove handler.
   *
   * @param event
   */
  mousemove(event: MouseEvent): void {
    if (!this.down) return;
    if (event.which !== 1) return this.finish(event);
    this.update$.next(event);
  }

  /**
   * Finishes the selection.
   */
  finish(event: MouseEvent): void {
    this.down = false;
    this.end$.next(event);
  }

  /**
   * @inheritdoc
   */
  async onActivate(): Promise<void> {
    this.addToolListeners();
  }

  /**
   * @inheritdoc
   */
  async onDeactivate(): Promise<void> {
    this.removeToolListeners();
  }
}
