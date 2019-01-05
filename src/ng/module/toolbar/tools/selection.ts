import * as _ from 'lodash';
import { Tool } from '../tool';
import { NgModuleRef } from '@angular/core';
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
import { Translate, Rotate, Resize, Select, Unselect } from './selection/ngxs/actions';
import { Entity } from 'ng/module/pixi/scene/entity';
import { DeleteEntity, UpdateEntity } from 'ng/module/pixi/ngxs/actions';

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

  protected store: Store;
  protected actions: Actions;

  // Context bound mouse event handler.
  protected onMousedown: EventListenerObject;
  protected onMouseup: EventListenerObject;
  protected onMousemove: EventListenerObject;

  constructor(id: string, icon?: string) {
    super(id, icon);
    this.container = new SelectionContainer();
    Pubsub.once('ready', (ref: NgModuleRef<AppModule>) => {
      this.service = ref.injector.get(PixiService);
      this.store = ref.injector.get(Store);
      this.actions = ref.injector.get(Actions);
      const scene = this.service.scene;
      this.actions.pipe(ofActionSuccessful(Select)).subscribe((action: Select) => {
        const filtered = scene.filter(entity => action.entities.indexOf(entity.id) >= 0);
        if (filtered.length) {
          this.map.addChild(this.container);
          this.container.select(filtered);
          this.store.dispatch(new Translate({ x: this.container.position.x, y: this.container.position.y }));
          this.store.dispatch(new Rotate(this.container.rotation));
          this.store.dispatch(
            new Resize(
              this.container.length > 1
                ? void 0
                : { x: this.container.entities[0].scale.x, y: this.container.entities[0].scale.y }
            )
          );
        }
      });
      this.actions.pipe(ofActionSuccessful(Unselect)).subscribe((action: Unselect) => {
        const filtered = action.entities ? scene.filter(entity => action.entities.indexOf(entity.id) >= 0) : void 0;
        const toUpdate = filtered ? filtered : this.container.entities;
        this.container.unselect(filtered);
        this.map.removeChild(this.container);
        if (toUpdate.length === 0) return;
        const proms = toUpdate.map(entity => entity.export('.'));
        return Promise.all(proms)
                .then(data => {
                  this.store.dispatch(new UpdateEntity(data, 'update'));
                });
      });
      this.actions.pipe(ofActionSuccessful(DeleteEntity)).subscribe((action: DeleteEntity) => {
        const idx = this.container.indexOf(action.id);
        if (idx < 0) return;
        const prev = this.container.entities.map(entity => entity.id);
        prev.splice(idx, 1);
        this.store.dispatch(new Unselect()).subscribe(() => {
          if (!prev.length) return;
          this.store.dispatch(new Select(prev));
        });
      });

      this.actions.pipe(ofActionSuccessful(Translate, Rotate, Resize))
        .subscribe((action: (Translate | Rotate | Resize)) => {
          if (action instanceof Translate)
            this.container.position.copy(<PointLike>action.position);
          else if (action instanceof Rotate)
            this.container.rotation = action.rotation;
          else if (action instanceof Resize && this.container.entities.length === 1)
            this.container.entities[0].scale.copy(<PointLike>action.size);
          else return;
          this.container.emit('updated');
        });

      this.setup();
    });
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
      new SelectionResizeHandler(this.container, this.renderer, this.service, this.store),
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
    canvas.addEventListener('mousedown', this.onMousedown);
    canvas.addEventListener('mouseup', this.onMouseup);
    canvas.addEventListener('mousemove', this.onMousemove);
  }

  /**
   * Removes the mouse listeners from the canvas element.
   *
   * @returns {void}
   */
  removeToolListeners(): void {
    const canvas = this.service.view;
    canvas.removeEventListener('mousedown', this.onMousedown);
    canvas.removeEventListener('mouseup', this.onMouseup);
    canvas.removeEventListener('mousemove', this.onMousemove);
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
    this.store.dispatch(new Unselect()).subscribe(() => {
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
    this.store.dispatch(new Select(selection)).subscribe(() => {
      this.emit('finish', selection, this.rectangle);
    });
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
