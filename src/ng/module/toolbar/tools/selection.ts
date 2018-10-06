import * as _ from 'lodash';
import { Tool } from '../tool';
import { NgModuleRef } from '@angular/core';
import { PixiService } from '../../pixi/service';
import { Map } from '../../pixi/scene/map';
import { Pubsub, AppModule } from 'ng/idx';
import { Graphics, interaction, PointLike } from 'pixi.js';
import { SelectionRectangle } from './selection/rectangle';
import { SelectionContainer } from './selection/container';
import { SelectionRenderer } from './selection/renderer';

/**
 *
 * Configuration interface for the selection tool.
 *
 * @export
 * @interface SelectionToolConfig
 */
export interface SelectionToolConfig {
  fill?: { alpha?: number; color?: number; };
  line?: { width?: number, color?: number; alpha?: number; }
}

/**
 *
 * The actual selection tool, managing calculations, rendering and container switches.
 * The whole implementation is divided into 3 parts:
 *  @see {SelectionRenderer} Renders the selection.
 *  @see {SelectionContainer} Provides selection and unselection method.
 *  @see {SelectionRectangle} Handles collisions when the user selects entities with the mouse
 *
 * @export
 * @class SelectionTool
 * @extends {Tool}
 */
export class SelectionTool extends Tool {

  /**
   * @type {SelectionToolConfig} The configuration for this tool.
   */
  config: SelectionToolConfig = { fill: { }, line: { } };

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

  // Context bound mouse event handler.
  protected onMousedown: EventListenerObject;
  protected onMouseup: EventListenerObject;
  protected onMousemove: EventListenerObject;

  constructor(id: string, icon?: string) {
    super(id, icon);
    this.container = new SelectionContainer();
    Pubsub.once('ready', (ref: NgModuleRef<AppModule>) => {
      const service = this.service = ref.injector.get(PixiService);
      this.globalMouse = this.service.renderer.plugins.interaction.mouse.global;
      this.map = service.scene;
      this.map.addChild(this.container);
      this.stage = service.app.stage;
      this.rectangle = new SelectionRectangle(this.stage);
      this.renderer = new SelectionRenderer(service, this.container);
      if (this.isActive)
        this.addToolListeners();
    });
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
   * Initializes the mouse handler functions, if not done yet.
   *
   * @returns {void}
   */
  protected initFunctions(): void {
    if (!this.onMousedown)
      this.onMousedown = this.mousedown.bind(this);
    if (!this.onMouseup)
      this.onMouseup = this.mouseup.bind(this);
    if (!this.onMousemove)
      this.onMousemove = this.mousemove.bind(this);
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

  /** @inheritDoc */
  onActivate(): Promise<any> {
    if (this.service)
      this.addToolListeners();
    return Promise.resolve();
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
    this.container.unselect();
    this.map.removeChild(this.container);
    this.rectangle.reset();
    this.stage.toLocal(this.globalMouse, void 0, this.rectangle.topLeft);
    this.graphics.clear();
    this.stage.addChild(this.graphics);
    this.down = true;
  }

  /**
   * The mouseup handler.
   *
   * @param {MouseEvent} event
   * @returns {void}
   */
  mouseup(event: MouseEvent): void {
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
    this.graphics.lineStyle(_.defaultTo(this.config.line.width, 1),
                            _.defaultTo(this.config.line.color, 0xffffff),
                            _.defaultTo(this.config.line.alpha, 1));
    this.graphics.beginFill(_.defaultTo(this.config.fill.color, 0xffffff),
                            _.defaultTo(this.config.fill.alpha, 0.25));
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
    const selection = this.map.entities.filter(child => this.rectangle.contains(child));
    if (selection.length) {
      this.map.addChild(this.container);
      this.container.select(selection);
    }
    this.emit('finish', selection, this.rectangle);
  }

  /** @inheritDoc */
  onDeactivate(): Promise<any> {
    this.removeToolListeners();
    return Promise.resolve();
  }

}