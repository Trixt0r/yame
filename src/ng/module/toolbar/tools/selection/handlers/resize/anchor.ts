import * as _ from 'lodash';
import { Graphics, interaction, Point, DisplayObject, Rectangle, PI_2, Container } from 'pixi.js';
import { SelectionContainer } from '../../container';
import { PixiService } from 'ng/module/pixi/idx';

/**
 * The config interface for the rendering.
 *
 * @export
 * @interface ResizeAnchorRenderingConfig
 */
export interface ResizeAnchorRenderingConfig {
  fill?: { alpha?: number; color?: number; };
  line?: { width?: number, color?: number; alpha?: number; },
  size?: number;
}

/**
 * @var {number} HOR Defines that an anchor is aligned horizontally and not centered, i.e. left or right.
 */
export const HOR: number = 1;

/**
 * @var {number} VERT Defines that an anchor is aligned horizontally and not centered, i.e. top or bottom.
 */
export const VERT: number = 2;

/**
 * @var {number} RIGHT Defines that an anchor can be moved to the right and is aligned right.
 */
export const RIGHT: number = 4;

/**
 * @var {number} DOWN Defines that an anchor can be moved downwards and is aligned at the bottom.
 */
export const DOWN: number = 8;

/**
 * @var {number} RIGHT Defines that an anchor can be moved to the left and is aligned left.
 */
export const LEFT: number = 16;

/**
 * @var {number} UP Defines that an anchor can be moved upwards and is aligned at the top.
 */
export const UP: number = 32;

const cursorOrder = ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'];

/**
 * A resize anchor is responsible for resizing the content of a single entity inside a selection container.
 * It will make sure that the size can be changed via mouse and keep the visual position at the same point.
 */
export class ResizeAnchor extends Graphics {

  private clickedPos: Point = null;
  private containerPos = new Point();
  private clickedScale = new Point();
  private clickedSize = new Point();
  private clickedBound = new Point();
  private tmp = new Point();
  private tmpXDirection: number;
  private tmpYDirection: number;
  private tmpXSignBounds: number;
  private tmpYSignBounds: number;
  private tmpLocalBounds: Rectangle;
  private mouseupFn: EventListenerObject;
  private mouseLeft = false;

  readonly xDirection: number;
  readonly yDirection: number;

  readonly offset: Point;

  /**
   * @type {DisplayObject} The target to resize.
   */
  target: DisplayObject = null;

  /**
   * @type {DisplayObject} The container which the target is part of.
   */
  container: SelectionContainer = null;

  /**
   * The rendering configuration for this anchor.
   *
   * @type {ResizeAnchorRenderingConfig}
   */
  config: ResizeAnchorRenderingConfig = {
    fill: { },
    line: { },
    size: 10
  };

  /**
   * Creates an instance of ResizeAnchor.
   * @param {number} type The anchor type, based on the constants in this module.
   *                      Example: `new ResizeAnchor(service, HOR | VERT | RIGHT | DOWN)` will place the anchor at the
   *                      bottom right. Resizing will happen downwards and to the right in this case.
   * @param {PixiService} service The pixi service, needed to apply the correct cursor.
   * @see HOR
   * @see VERT
   * @see RIGHT
   * @see DOWN
   * @see LEFT
   * @see UP
   */
  constructor(public type: number, public service: PixiService) {
    super();
    if (this.matches(LEFT) && this.matches(RIGHT)) {
      throw new Error('LEFT and RIGHT can not be set at the same time');
    } else if (this.matches(DOWN) && this.matches(UP)) {
      throw new Error('DOWN and UP can not be set at the same time');
    }
    this.xDirection = this.matches(LEFT) ? -1 : 1;
    this.yDirection = this.matches(UP) ? -1 : 1;
    this.interactive = true;
    this.mouseupFn = this.mouseup.bind(this);
    this.on('mousedown', this.mousedown, this);
    this.on('mousemove', this.mousemove, this);
    this.on('mouseover', this.updateCursor, this);
    this.on('mouseout', this.resetCursor, this);
    window.addEventListener('mouseup', this.mouseupFn);
    this.offset = new Point();
    this.setUpOffset();
  }

  /**
   * Sets up the relative offset based on the type of this anchor.
   * You may call this after changing the type.
   *
   * @returns {void}
   */
  setUpOffset(): void {
    this.offset.set(0.5, 0.5);
    if (this.matches(HOR)) {
      this.offset.x = this.matches(RIGHT) ? 1 : 0;
    }
    if (this.matches(VERT)) {
      this.offset.y = this.matches(DOWN) ? 1 : 0;
    }
  }

  /**
   * Calculates whether the given type matches the type of this anchor.
   *
   * @param {number} type The type to test.
   * @returns {boolean}
   */
  matches(type: number): boolean {
    return (this.type & type) !== 0;
  }

  /**
   * Renders this anchor with the current configuration.
   *
   * @returns {void}
   */
  render(): void {
    const lineWidth = _.defaultTo(this.config.line.width, 1);
    const lineColor = _.defaultTo(this.config.line.color, 0xffffff);
    const lineAlpha = _.defaultTo(this.config.line.alpha, 1);
    const fillColor = _.defaultTo(this.config.fill.color, 0x000000);
    const fillAlpha =_.defaultTo(this.config.fill.alpha, 1);

    this.clear();
    if (fillAlpha) this.beginFill(fillColor, fillAlpha);

    this.lineStyle(lineWidth, lineColor, lineAlpha);
    this.drawRect(-this.config.size / 2, -this.config.size / 2, this.config.size, this.config.size);

    if (fillAlpha) this.endFill();
    this.hitArea = this.getLocalBounds().clone();
    (<Rectangle>this.hitArea).pad(5, 5);
  }

  /**
   * Updates the cursor based on the current rotation.
   *
   * @returns {void}
   */
  updateCursor(event?: interaction.InteractionEvent): void {
    this.mouseLeft = event === void 0;
    let style = '';
    const angleThresh = Math.PI / cursorOrder.length;
    if (this.matches(VERT) && this.matches(HOR)) {
      style = this.xDirection * this.yDirection === -1 ? 'nesw-resize' : 'nwse-resize';
    } else if (this.matches(VERT)) {
      style = 'ns-resize';
    } else {
      style = 'ew-resize';
    }
    const offset = cursorOrder.indexOf(style);
    const closest = Math.round((this.rotation + offset * angleThresh) / angleThresh ) % cursorOrder.length;
    style = cursorOrder[closest];
    this.service.app.view.style.cursor = style;
  }

  /**
   * Resets the cursor back.
   *
   * @returns {void}
   */
  resetCursor(event?: interaction.InteractionEvent): void {
    if (event !== void 0) this.mouseLeft = true;
    if (this.clickedPos || (!this.clickedPos && !this.mouseLeft)) return;
    this.service.app.view.style.cursor = '';
  }

  /**
   * Validates the current state of this anchor.
   *
   * @throws {Error} If no target or no container is defined with an according message.
   * @returns {true} If the mouse can be used
   */
  validate(): true {
    if (!this.target) throw new Error('No target specified');
    if (!this.container) throw new Error('You have to define a selection container in order to be able to resize the target');
    return true;
  }

  /**
   * Mouse down handler.
   *
   * Makes sure that all temp variables are set up correctly.
   *
   * @param {interaction.InteractionEvent} event
   * @returns {void}
   */
  mousedown(event: interaction.InteractionEvent): void {
    if (this.clickedPos) return;
    this.validate();
    this.clickedScale.copy(this.target.scale);
    this.target.scale.set(1);
    this.clickedPos = this.target.toLocal(event.data.global, null, null, false);
    this.containerPos.set(this.container.position.x, this.container.position.y);
    this.target.scale.copy(this.clickedScale);
    this.tmpLocalBounds = this.target.getLocalBounds().clone();
    const bnds = this.tmpLocalBounds;
    this.tmpXDirection = this.xDirection * Math.sign(this.clickedScale.x);
    this.tmpYDirection = this.yDirection * Math.sign(this.clickedScale.y);
    this.tmpXSignBounds = Math.sign(this.tmpXDirection + 1);
    this.tmpYSignBounds = Math.sign(this.tmpYDirection + 1);
    this.clickedBound.set(bnds.x + bnds.width * this.tmpXSignBounds,
                          bnds.y + bnds.height * this.tmpYSignBounds);
    this.clickedSize.set(bnds.width, bnds.height);
    this.container.parent.toLocal(this.clickedBound, this.target, this.clickedBound);
    this.emit('handle:start');
  }

  /**
   * Mouse move handler.
   *
   * Here happens the acutal resizing based on the given interaction event.
   *
   * @param {interaction.InteractionEvent} event
   * @returns {void}
   */
  mousemove(event: interaction.InteractionEvent): void {
    if (!this.clickedPos) return;
    this.validate();
    this.container.position.copy(this.containerPos);
    const tmpScale = this.tmp;
    tmpScale.set(this.target.scale.x, this.target.scale.y);
    this.target.scale.set(1);
    const currentPos = this.target.toLocal(event.data.global);
    this.target.scale.copy(tmpScale);
    const diff = this.tmp;
    diff.set(currentPos.x - this.clickedPos.x, currentPos.y - this.clickedPos.y);
    diff.x *= this.tmpXDirection;
    diff.y *= this.tmpYDirection;
    const scaleX = (diff.x / this.clickedSize.x);
    const scaleY = (diff.y / this.clickedSize.y);

    if (this.matches(HOR)) {
      this.target.scale.x = this.clickedScale.x + scaleX;
    }
    if (this.matches(VERT)) {
      this.target.scale.y = this.clickedScale.y + scaleY;
    }
    const bnds = this.tmpLocalBounds;
    const bound = this.tmp;
    bound.set(bnds.x + bnds.width * this.tmpXSignBounds,
              bnds.y + bnds.height * this.tmpYSignBounds);
    this.container.parent.toLocal(bound, this.target, bound);
    bound.set((bound.x - this.clickedBound.x), (bound.y - this.clickedBound.y));
    this.container.position.x = this.containerPos.x + bound.x;
    this.container.position.y = this.containerPos.y + bound.y;
    this.updateCursor();
    this.emit('updated');
  }

  /**
   * Mouse up handler.
   *
   * Cancels the mouse handling.
   *
   * @param {interaction.InteractionEvent} [event]
   * @returns {void}
   */
  mouseup(event?: interaction.InteractionEvent): void {
    if (!this.clickedPos) return;
    this.clickedPos = null;
    this.resetCursor();
    this.emit('handle:end');
  }

  /**
   * Updates the position of this anchor.
   *
   * @param {Container} stage The current stage, this anchor is attached to.
   * @param {Rectangle} bnds The bounds of the container.
   * @returns {void}
   */
  update(stage: Container, bnds: Rectangle): void {
    this.validate();
    this.position.set(bnds.x + bnds.width * this.offset.x, bnds.y + bnds.height * this.offset.y);
    this.rotation = this.container.rotation;
    stage.toLocal(this.position, this.container, this.position);
  }

}
