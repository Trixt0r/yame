import * as _ from 'lodash';
import { Tool } from '../tool';
import { Injectable } from '@angular/core';
import { ToolbarService } from 'ng/idx';
import { Graphics, Container } from 'pixi.js';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Select, Unselect, SceneService } from 'ng/module/scene';
import { SceneComponent, SceneEntity, SceneEntityType } from 'common/scene';
import { HotkeyService } from 'ng/services/hotkey.service';

/**
 *
 * Configuration interface for the selection tool.
 *
 * @export
 * @interface SelectionToolConfig
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
   * @type {SelectionToolConfig} The configuration for this tool.
   */
  config: SelectionToolConfig = { fill: {}, line: {} };

  /**
   * @type {any[]} The handlers of the selection container.
   */
  readonly handlers: any[] = [];

  // Protected fields, needed to render and handle mouse events
  protected stage: Container;
  protected graphics = new Graphics();
  protected down = false;

  // Context bound mouse event handler.
  protected onMousedown: EventListenerObject;
  protected onMouseup: EventListenerObject;
  protected onMousemove: EventListenerObject;

  protected selectAction = new Select([], []);
  protected unselectAction = new Unselect();

  readonly begin$ = new Subject<MouseEvent>();
  readonly update$ = new Subject<MouseEvent>();
  readonly end$ = new Subject<MouseEvent>();

  handledByExternal = false;

  /**
   * @readonly
   * @type {Graphics} The graphics which render the rectangle following the mouse.
   */
  get selectionGraphics(): Graphics {
    return this.graphics;
  }

  constructor(protected store: Store, protected scene: SceneService, service: ToolbarService, hotkeys: HotkeyService) {
    super('edit', 'edit');
    this.initFunctions();
    service.register(this);

    hotkeys.register({ keys: ['control.a', 'meta.a'] }).subscribe(() => {
      this.store.dispatch(
        new Select(
          scene.entities.filter((it) => this.isSelectable(it)).map((it) => it.id),
          []
        )
      );
    });
  }

  /**
   * Initializes the mouse handler functions, if not done yet.
   *
   * @returns {void}
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
    const isolated = this.store.selectSnapshot((state) => state.select).isolated;
    const parent = entity.parent ? this.scene.getEntity(entity.parent) : null;
    const isOnLayer = parent ? parent.type === SceneEntityType.Layer : false;
    return isolated
      ? entity.parent === isolated.id
      : !entity.parent || isOnLayer || (fromHierarchy && entity.type !== SceneEntityType.Layer);
  }

  dispatchSelect(entities: string[], components: SceneComponent[]) {
    this.selectAction.components = components;
    this.selectAction.entities = entities;
    return this.store.dispatch(this.selectAction);
  }

  /**
   * Adds the mouse handlers to the canvas element.
   *
   * @returns {void}
   */
  addToolListeners(): void {
    setImmediate(() => this.scene.renderer.component.ref.nativeElement.addEventListener('mousedown', this.onMousedown));
  }

  /**
   * Removes the mouse listeners from the canvas element.
   *
   * @returns {void}
   */
  removeToolListeners(): void {
    this.scene.renderer.component.ref.nativeElement.removeEventListener('mousedown', this.onMousedown);
  }

  /**
   * The mousedown handler.
   *
   * @param {MouseEvent} event
   * @returns {void}
   */
  mousedown(event: MouseEvent): void {
    if (this.handledByExternal) return; // Delegate the work to the current container
    if (event.which !== 1) return;
    if (this.down) return;
    this.down = true;
    window.addEventListener('mouseup', this.onMouseup);
    window.addEventListener('mousemove', this.onMousemove);
    this.unselectAction.entities = this.store.selectSnapshot((state) => state.select).entities;
    if (this.unselectAction.entities.length > 0) this.store.dispatch(this.unselectAction);
    this.begin$.next(event);
  }

  /**
   * The mouseup handler.
   *
   * @param {MouseEvent} event
   * @returns {void}
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
   * @param {MouseEvent} event
   * @returns {void}
   */
  mousemove(event: MouseEvent): void {
    if (!this.down) return;
    if (event.which !== 1) return this.finish(event);
    this.update$.next(event);
  }

  /**
   * Finishes the selection.
   *
   *
   */
  finish(event?: MouseEvent): void {
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
