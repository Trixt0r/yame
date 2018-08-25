import * as _ from 'lodash';
import { Graphics, Container, Rectangle, Polygon, Point, } from "pixi.js";
import { SelectionContainer } from "./container";
import { PixiService } from "../../../pixi/idx";
import { SelectionRectangle } from "./rectangle";

/**
 * The config interface for the rendering.
 *
 * @export
 * @interface SelectionRendererConfig
 */
export interface SelectionRendererConfig {
  fill?: { alpha?: number; color?: number; };
  line?: { width?: number, color?: number; alpha?: number; }
}

/**
 * The selection renderer, i.e. the part, which renders the entites in the provided selection container.
 * An instance of this class makes sure, that the bounds are properly rendered, no matter how the camera is configured,
 * so scaling is not messed up while zooming or moving.
 *
 * @export
 * @class SelectionRenderer
 * @extends {Graphics}
 */
export class SelectionRenderer extends Graphics {

  /**
   * @type {SelectionRendererConfig} The rendering config.
   */
  config: SelectionRendererConfig = { fill: { }, line: { } };

  // Protected fields, for handling the rendering
  protected stage: Container;
  protected currentBounds: Rectangle;
  protected absoluteBounds: Rectangle;
  protected attached: boolean;
  protected topLeft: Point;
  protected bottomRight: Point;

  constructor(protected service: PixiService,
              protected container: SelectionContainer = null,
              nativeLines: boolean = false) {
    super(nativeLines);
    this.stage = this.service.stage;
    this.absoluteBounds = new Rectangle();
    this.attached = false;
    this.topLeft = new Point();
    this.bottomRight = new Point();
    this.service.scene.on('camera:update', this.update, this); // Setup here, since the scene does not change
    this.setupContainerHandlers();
  }

  /**
   * @type {SelectionContainer} The selection container of this renderer.
   */
  get selectionContainer(): SelectionContainer {
    return this.container;
  }

  set selectionContainer(container: SelectionContainer) {
    if (this.container === container) return;
    const old = this.container;
    if (old) {
      old.off(null, null, this);
      this.detach();
    }
    this.container = container;
    this.setupContainerHandlers();
    this.emit('change:selectionContainer', this.container, old);
  }

  /**
   * Sets up the event handlers, for the events the bound selection container is emitting.
   *
   * @protected
   * @returns {void}
   * @memberof SelectionRenderer
   */
  protected setupContainerHandlers(): void {
    if (!this.container) return;
    this.container.on('selected', this.attach, this);
    this.container.on('moved', this.update, this);
    this.container.on('unselected', this.detach, this);
  }

  /**
   * Attaches this renderer to the stage container.
   * It takes a snapshot of the current selection container bounds.
   *
   * @protected
   * @returns {void}
   */
  protected attach(): void {
    if (this.attached) return;
    if (this.container.entities.length <= 0) { console.log('here'); return this.detach(); }
    this.currentBounds = this.container.getLocalBounds();
    this.stage.addChild(this);
    this.attached = true;
    this.emit('attached');
    this.update();
  }

  /**
   * Updates the global coordinates of the bounds and re-renders them.
   *
   * @protected
   * @returns {void}
   */
  protected update(): void {
    if (!this.attached) return;
    this.clear();
    const bnds = this.currentBounds;
    this.topLeft.set(bnds.x, bnds.y);
    this.bottomRight.set(bnds.x + bnds.width, bnds.y + bnds.height);
    this.container.toGlobal(this.topLeft, this.topLeft);
    this.container.toGlobal(this.bottomRight, this.bottomRight);
    SelectionRectangle.fixRectangle(this.topLeft, this.bottomRight, this.absoluteBounds);
    this.lineStyle(_.defaultTo(this.config.line.width, 1),
                            _.defaultTo(this.config.line.color, 0xffffff),
                            _.defaultTo(this.config.line.alpha, 1));
    this.beginFill(_.defaultTo(this.config.fill.color, 0xffffff),
                            _.defaultTo(this.config.fill.alpha, 0));
    this.drawShape(this.absoluteBounds);
    this.endFill();
    this.emit('updated');
  }

  /**
   * Detaches this renderer from the stage, so it will not be rendered, while nothing is selected.
   *
   * @protected
   * @returns {void}
   */
  protected detach(): void {
    if (!this.attached) return;
    this.clear();
    this.stage.removeChild(this);
    this.attached = false;
    this.emit('detached');
  }

  /**
   * @readonly
   * @type {boolean} Whether this renderer is currently attached to the stage for rendering.
   */
  get isAttached(): boolean {
    return this.attached;
  }

}
