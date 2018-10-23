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
  protected outerBounds: Rectangle;
  protected attached: boolean;
  protected boundingPoints: Point[]; // Clockwise bounding points, topLeft, topRight, bottomRight, bottomLeft

  constructor(protected service: PixiService,
              protected container: SelectionContainer = null,
              nativeLines: boolean = false) {
    super(nativeLines);
    this.stage = this.service.stage;
    this.outerBounds = new Rectangle();
    this.attached = false;
    this.boundingPoints = [
      new Point(),
      new Point(),
      new Point(),
      new Point(),
    ]
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
    this.container.on('update', this.update, this);
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
    if (this.container.entities.length <= 0) return this.detach();
    this.stage.addChild(this);
    this.attached = true;
    this.emit('attached', this.stage);
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
    const bnds = this.container.getLocalBounds();

    this.boundingPoints[0].set(bnds.x, bnds.y);
    this.boundingPoints[1].set(bnds.x + bnds.width, bnds.y);
    this.boundingPoints[2].set(bnds.x + bnds.width, bnds.y + bnds.height);
    this.boundingPoints[3].set(bnds.x, bnds.y + bnds.height);

    this.boundingPoints.forEach(point => this.stage.toLocal(point, this.container, point));
    this.outerBounds.x = _.minBy(this.boundingPoints, 'x').x;
    this.outerBounds.width = _.maxBy(this.boundingPoints, 'x').x - this.outerBounds.x;
    this.outerBounds.y = _.minBy(this.boundingPoints, 'y').y;
    this.outerBounds.height = _.maxBy(this.boundingPoints, 'y').y - this.outerBounds.y;

    this.lineStyle(_.defaultTo(this.config.line.width, 1),
                            _.defaultTo(this.config.line.color, 0xffffff),
                            _.defaultTo(this.config.line.alpha, 1));
    this.beginFill(_.defaultTo(this.config.fill.color, 0xffffff),
                            _.defaultTo(this.config.fill.alpha, 0));
    this.drawShape(this.container.getBounds());
    this.drawShape(this.outerBounds);
    this.moveTo(this.boundingPoints[0].x, this.boundingPoints[0].y);
    const tmp = this.boundingPoints.slice();
    tmp.push(tmp.shift());
    tmp.forEach(point => this.lineTo(point.x, point.y));
    this.endFill();
    this.emit('updated', this.stage, this.outerBounds);
  }

  /**
   * Detaches this renderer from the stage, so it will not be rendered, while nothing is selected.
   *
   * @protected
   * @returns {void}
   */
  protected detach(): void {
    if (!this.attached) return;
    if (this.container.length !== 0) return this.update();
    this.clear();
    this.stage.removeChild(this);
    this.attached = false;
    this.emit('detached', this.stage);
  }

  /**
   * @readonly
   * @type {boolean} Whether this renderer is currently attached to the stage for rendering.
   */
  get isAttached(): boolean {
    return this.attached;
  }

}
