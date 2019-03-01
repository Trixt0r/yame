import * as _ from 'lodash';
import { Tool } from '../tool';
import { NgModuleRef, NgZone } from '@angular/core';
import { PixiService } from '../../pixi/service';
import { Map } from '../../pixi/scene/map';
import { Pubsub, AppModule } from 'ng/idx';
import { Graphics, PointLike, Point } from 'pixi.js';
import { SelectionRectangle } from './selection/rectangle';
import { SelectionContainer } from './selection/container';
import { SelectionRenderer } from './selection/renderer';
import { SelectionTranslateHandler } from './selection/handlers/translate';
import { SelectionRotateHandler } from './selection/handlers/rotate';
import { SelectionResizeHandler } from './selection/handlers/resize';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { Select, Unselect, UpdateSelection, SelectionActions } from './selection/ngxs/actions';
import { Entity } from 'ng/module/pixi/scene/entity';
import { DeleteEntity, UpdateEntity, UpdateEntityProperty } from 'ng/module/pixi/ngxs/actions';
import { Group, SpriteEntity } from 'ng/module/pixi/idx';

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
 * The actual selection tool, managing calculations, rendering and container switches.
 * The whole implementation is divided into 3 parts:
 * @see {SelectionRenderer} Renders the selection.
 * @see {SelectionContainer} Provides selection and unselection method.
 * @see {SelectionRectangle} Handles collisions when the user selects entities with the mouse
 *
 * @export
 * @class SelectionTool
 * @extends {Tool}
 */
export class SelectionTool extends Tool {
  /**
   * @type {SelectionToolConfig} The configuration for this tool.
   */
  config: SelectionToolConfig = { fill: {}, line: {} };

  /**
   * @type {any[]} The handlers of the selection container.
   */
  readonly handlers: any[] = [];

  // The 3 main parts of this tool
  protected rectangle: SelectionRectangle;
  protected container: SelectionContainer;
  protected renderer: SelectionRenderer;

  // Protected fields, needed to render and handle mouse events
  protected stage: PIXI.Container;
  protected map: Map;
  protected graphics = new Graphics();
  protected down = false;
  protected service: PixiService;
  protected globalMouse: PointLike;

  protected zone: NgZone;
  protected store: Store;
  protected actions: Actions;

  // Context bound mouse event handler.
  protected onMousedown: EventListenerObject;
  protected onMouseup: EventListenerObject;
  protected onMousemove: EventListenerObject;

  protected selectAction = new Select([]);
  protected unselectAction = new Unselect();

  constructor(id: string, icon?: string) {
    super(id, icon);
    this.container = new SelectionContainer();
    Pubsub.once('ready', (ref: NgModuleRef<AppModule>) => {
      this.service = ref.injector.get(PixiService);
      this.zone = ref.injector.get(NgZone);
      this.store = ref.injector.get(Store);
      this.actions = ref.injector.get(Actions);

      const tmpEntity = new SpriteEntity();
      this.container.select([tmpEntity]);
      setImmediate(() => this.container.unselect());

      this.zone.runOutsideAngular(() => {
        const scene = this.service.scene;
        this.actions
          .pipe(ofActionSuccessful(Select, Unselect, UpdateEntity, UpdateEntityProperty, DeleteEntity))
          .subscribe((action: SelectionActions | DeleteEntity | UpdateEntityProperty) => {
            if (action instanceof Select) {
              const filtered = scene.filter(entity => action.entities.indexOf(entity.id) >= 0);
              if (filtered.length) {
                this.map.addChild(this.container);
                this.container.select(filtered);
                this.store.dispatch(
                  new UpdateSelection(this.container.getProperties(), this.container.additionalPropertyNames)
                );
              }
            } else if (action instanceof Unselect) {
              const filtered = action.entities ? scene.filter(entity => action.entities.indexOf(entity.id) >= 0) : void 0;
              const toUpdate = filtered ? filtered : this.container.entities;
              this.container.unselect(filtered);
              this.map.removeChild(this.container);
              if (toUpdate.length === 0) return;
              const proms = toUpdate.map(entity => entity.export('.'));
              return Promise.all(proms).then(data => {
                this.store.dispatch([
                  new UpdateEntity(data, 'update'),
                  new UpdateSelection(this.container.getProperties(), this.container.additionalPropertyNames)
                ]);
              });
            } else if (action instanceof DeleteEntity) {
              const idx = this.container.indexOf(action.id);
              if (idx < 0) return;
              const prev = this.container.entities.map(entity => entity.id);
              prev.splice(idx, 1);
              this.store.dispatch(this.unselectAction).first().subscribe(() => {
                if (!prev.length) return;
                this.dispatchSelect(prev);
              });
            } else if ((action instanceof UpdateSelection && !action.attributes) ||
                        (action instanceof UpdateEntityProperty && action.id === 'select')) {
              if (this.container.updateFromAction(action))
                this.container.emit('updated');
            }
          });

        this.setup();
      });
    });
  }

  dispatchSelect(entities: string[]) {
    this.selectAction.entities = entities;
    return this.store.dispatch(this.selectAction);
  }

  /**
   * Sets this tool up.
   * Creates the default handlers and the rendering parts of this tool.
   *
   * @returns {void}
   */
  setup(): void {
    if (!this.service) throw new Error('No pixi service defined. Pubsub event "ready" not triggered?');
    this.container.removeAllListeners();
    this.globalMouse = this.service.renderer.plugins.interaction.mouse.global;
    this.map = this.service.scene;
    this.map.addChild(this.container);
    this.stage = this.service.app.stage;
    this.rectangle = new SelectionRectangle(this.stage);
    this.renderer = new SelectionRenderer(this.service, this.container);
    if (this.isActive) this.addToolListeners();
    this.handlers.splice(0, this.handlers.length);
    this.handlers.push(
      new SelectionTranslateHandler(this.container, this.service, this.store),
      new SelectionRotateHandler(this.container, this.renderer, this.service, this.store),
      new SelectionResizeHandler(this.container, this.renderer, this.service, this.store)
    );
  }

  /**
   * @readonly
   * @type {SelectionRenderer} The selection renderer instance.
   */
  get selectionRenderer(): SelectionRenderer {
    return this.renderer;
  }

  /**
   * @readonly
   * @type {SelectionRenderer} The selection rectangle instance.
   */
  get selectionRectangle(): SelectionRectangle {
    return this.rectangle;
  }

  /**
   * @readonly
   * @type {SelectionContainer} The selection container instance.
   */
  get selectionContainer(): SelectionContainer {
    return this.container;
  }

  /**
   * @readonly
   * @type {Graphics} The graphics which render the rectangle following the mouse.
   */
  get selectionGraphics(): Graphics {
    return this.graphics;
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

  protected isSelectable(entity: Entity): boolean {
    return entity.visibility && !entity.locked;
  }

  /**
   * Adds the mouse handlers to the canvas element.
   *
   * @returns {void}
   */
  addToolListeners(): void {
    this.initFunctions();
    const canvas = this.service.view;
    this.zone.runOutsideAngular(() => {
      canvas.addEventListener('mousedown', this.onMousedown);
    });
  }

  /**
   * Removes the mouse listeners from the canvas element.
   *
   * @returns {void}
   */
  removeToolListeners(): void {
    const canvas = this.service.view;
    this.zone.runOutsideAngular(() => {
      canvas.removeEventListener('mousedown', this.onMousedown);
    });
  }

  /**
   * The mousedown handler.
   *
   * @param {MouseEvent} event
   * @returns {void}
   */
  mousedown(event: MouseEvent): void {
    if (this.container.isHandling) return; // Delegate the work to the current container
    if (event.which !== 1) return;
    if (this.down) return;
    window.addEventListener('mouseup', this.onMouseup);
    window.addEventListener('mousemove', this.onMousemove);
    this.zone.runOutsideAngular(() => {
      this.store.dispatch(this.unselectAction).first().subscribe(() => {
        this.rectangle.reset();
        this.stage.toLocal(this.globalMouse, void 0, this.rectangle.topLeft);
        this.rectangle.bottomRight.copy(this.rectangle.topLeft);
        this.rectangle.update();
        const selection = this.map.filter(
          child => this.isSelectable(child) && child.containsPoint(<Point>this.globalMouse)
        );
        if (selection.length > 0) {
          this.finish();
          this.container.emit('mousedown', this.service.renderer.plugins.interaction.eventData);
          return;
        }
        this.graphics.clear();
        this.stage.addChild(this.graphics);
        this.down = true;
      });
    });
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
    this.finish();
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
    if (event.which !== 1) return this.finish();
    this.stage.toLocal(this.globalMouse, void 0, this.rectangle.bottomRight);
    this.rectangle.update();
    this.graphics.clear();
    this.graphics.lineStyle(
      _.defaultTo(this.config.line.width, 1),
      _.defaultTo(this.config.line.color, 0x0055ff),
      _.defaultTo(this.config.line.alpha, 1)
    );
    this.graphics.beginFill(_.defaultTo(this.config.fill.color, 0x0055ff), _.defaultTo(this.config.fill.alpha, 0.25));
    this.graphics.drawShape(this.rectangle.rectangle);
    this.graphics.endFill();
  }

  /**
   * Finishes the selection.
   *
   * @returns {void}
   */
  finish(): void {
    this.down = false;
    this.stage.removeChild(this.graphics);
    const selection = this.map
      .filter(child => this.isSelectable(child) && this.rectangle.contains(child), this, true)
      .map(entity => entity.id);
    // const time = performance.now();
    if (selection.length)
      this.dispatchSelect(selection).first().subscribe(() => {
        // console.log('time', performance.now() - time);
        this.emit('finish', selection, this.rectangle);
      });
    else
      this.emit('finish');
  }

  /** @inheritDoc */
  onActivate(): Promise<any> {
    if (this.service) this.addToolListeners();
    return Promise.resolve();
  }

  /** @inheritDoc */
  onDeactivate(): Promise<any> {
    this.removeToolListeners();
    return Promise.resolve();
  }
}
