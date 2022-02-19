import { PixiRendererService } from '../../../renderer.service';
import { PixiSelectionContainerService } from '../../container.service';
import { CursorService } from 'ng/services/cursor.service';
import { Graphics, Point, Rectangle, Container, InteractionEvent } from 'pixi.js';

/**
 * The config interface for the rendering.
 *
 * @export
 * @interface ResizeAnchorRenderingConfig
 */
export interface ResizeAnchorRenderingConfig {
  fill?: { alpha?: number; color?: number };
  line?: { width?: number; color?: number; alpha?: number };
  size?: number;
}

/**
 * @var {number} HOR Defines that an anchor is aligned horizontally and not centered, i.e. left or right.
 */
export const HOR = 1;

/**
 * @var {number} VERT Defines that an anchor is aligned horizontally and not centered, i.e. top or bottom.
 */
export const VERT = 2;

/**
 * @var {number} RIGHT Defines that an anchor can be moved to the right and is aligned right.
 */
export const RIGHT = 4;

/**
 * @var {number} DOWN Defines that an anchor can be moved downwards and is aligned at the bottom.
 */
export const DOWN = 8;

/**
 * @var {number} RIGHT Defines that an anchor can be moved to the left and is aligned left.
 */
export const LEFT = 16;

/**
 * @var {number} UP Defines that an anchor can be moved upwards and is aligned at the top.
 */
export const UP = 32;

/**
 * A resize anchor is responsible for resizing the content of a single entity inside a selection container.
 * It will make sure that the size can be changed via mouse and keep the visual position at the same point.
 */
export class ResizeAnchor extends Graphics {
  private clickedPos?: Point | null = null;
  private containerPos = new Point();
  private clickedSize = new Point();
  private clickedBound = new Point();
  private tmp = new Point();
  private tmpXDirection: number = 0;
  private tmpYDirection: number = 0;
  private tmpXSignBounds: number = 0;
  private tmpYSignBounds: number = 0;
  private tmpLocalBounds?: Rectangle | null = null;
  private mouseupFn: (event: MouseEvent) => void;
  private mouseLeft = false;

  readonly xDirection: number;
  readonly yDirection: number;

  readonly offset: Point;

  /**
   * The target pixi container.
   */
  target: Container | null = null;

  /**
   * The container which the target is part of.
   */
  containerService: PixiSelectionContainerService | null = null;

  /**
   * The rendering configuration for this anchor.
   *
   * @type {ResizeAnchorRenderingConfig}
   */
  config: ResizeAnchorRenderingConfig = {
    fill: {
      color: 0x303030,
      alpha: 1,
    },
    line: {
      width: 1,
      color: 0xffffff,
      alpha: 1,
    },
    size: 15,
  };

  /**
   * Creates an instance of ResizeAnchor.
   * @param type The anchor type, based on the constants in this module.
   *             Example: `new ResizeAnchor(service, HOR | VERT | RIGHT | DOWN)` will place the anchor at the
   *             bottom right. Resizing will happen downwards and to the right in this case.
   * @param service The pixi service, needed to apply the correct cursor.
   * @see HOR
   * @see VERT
   * @see RIGHT
   * @see DOWN
   * @see LEFT
   * @see UP
   */
  constructor(public type: number, public service: PixiRendererService, public cursorService: CursorService) {
    super();
    if (this.matches(LEFT) && this.matches(RIGHT)) {
      throw new Error('LEFT and RIGHT can not be set at the same time');
    } else if (this.matches(DOWN) && this.matches(UP)) {
      throw new Error('DOWN and UP can not be set at the same time');
    }
    this.zIndex = 10;
    this.xDirection = this.matches(LEFT) ? -1 : 1;
    this.yDirection = this.matches(UP) ? -1 : 1;
    this.interactive = true;
    this.mouseupFn = this.mouseup.bind(this);
    this.on('mousedown', this.mousedown, this);
    this.on('mouseover', this.updateCursor, this);
    this.on('mouseout', this.resetCursor, this);
    this.offset = new Point();
    this.setUpOffset();
  }

  /**
   * Sets up the relative offset based on the type of this anchor.
   * You may call this after changing the type.
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
   * @param type The type to test.
   * @returns The result.
   */
  matches(type: number): boolean {
    return (this.type & type) !== 0;
  }

  /**
   * Draws this anchor with the current configuration.
   */
  drawData(): void {
    const lineWidth = this.config?.line?.width;
    const lineColor = this.config?.line?.color;
    const lineAlpha = this.config?.line?.alpha;
    const fillColor = this.config?.fill?.color;
    const fillAlpha = this.config?.fill?.alpha;

    this.clear();
    if (fillAlpha) this.beginFill(fillColor, fillAlpha);

    this.lineStyle(lineWidth!, lineColor, lineAlpha);
    this.drawCircle(0, 0, (this.config?.size || 1) / 2);

    if (fillAlpha) this.endFill();
    this.hitArea = this.getLocalBounds().clone();
    (this.hitArea as Rectangle).pad(5, 5);
  }

  /**
   * Updates the cursor based on the current rotation.
   */
  updateCursor(event?: InteractionEvent): void {
    if (this.containerService?.isHandling && this.containerService?.currentHandler !== this) return;
    if (event) event.stopPropagation();
    this.mouseLeft = event === void 0;
    let rotOff = 0;
    if (this.matches(VERT) && this.matches(HOR)) {
      rotOff = this.xDirection * this.yDirection === -1 ? Math.PI * 0.25 : Math.PI * 0.75;
      rotOff *= Math.sign(this.target?.width as number) * Math.sign(this.target?.height as number);
    } else if (this.matches(HOR)) {
      rotOff = Math.PI * 0.5;
    }
    this.cursorService.begin(this.service.view as HTMLElement);
    this.cursorService.image.src = 'assets/resize-icon.svg';
    this.cursorService.image.style.transform = `rotate(${
      (this.containerService?.container?.rotation || 0) + rotOff
    }rad)`;
  }

  /**
   * Resets the cursor back.
   */
  resetCursor(event?: InteractionEvent): void {
    if (event !== void 0) this.mouseLeft = true;
    if (this.clickedPos || (!this.clickedPos && !this.mouseLeft)) return;
    this.cursorService.end();
  }

  /**
   * Handles the mouse down event.
   * Makes sure that all temp variables are set up correctly.
   *
   * @param event
   */
  mousedown(event: InteractionEvent): void {
    if (this.clickedPos || !this.target || !this.containerService) return;
    this.on('mousemove', this.mousemove, this);
    this.off('mouseover', this.updateCursor, this);
    this.off('mouseout', this.resetCursor, this);
    window.addEventListener('mouseup', this.mouseupFn);
    this.tmpLocalBounds = this.target?.getLocalBounds().clone();

    this.tmp.set(this.target?.width, this.target?.height);
    this.target.width = this.tmpLocalBounds?.width || 0;
    this.target.height = this.tmpLocalBounds?.height || 0;

    this.clickedPos = this.target?.toLocal(event.data.global, void 0, void 0, false) as Point;
    this.containerPos.copyFrom(this.containerService.container.position);

    this.target.width = this.tmp.x;
    this.target.height = this.tmp.y;

    const bnds = this.tmpLocalBounds;
    this.tmpXDirection = this.xDirection;
    this.tmpYDirection = this.yDirection;
    this.tmpXSignBounds = Math.sign(this.tmpXDirection + 1);
    this.tmpYSignBounds = Math.sign(this.tmpYDirection + 1);
    this.clickedBound.set(
      bnds.x + (bnds.width - bnds.width * this.tmpXSignBounds),
      bnds.y + (bnds.height - bnds.height * this.tmpYSignBounds)
    );
    this.clickedSize.set(this.target.width, this.target.height);
    this.containerService.container.parent.toLocal(this.clickedBound, this.target, this.clickedBound);
    this.emit('handle:start');
  }

  /**
   * Handles the mouse move event.
   *
   * Handles the actual resizing based on the given interaction event.
   *
   * @param event
   */
  mousemove(event: InteractionEvent): void {
    if (!this.clickedPos || !this.target || !this.containerService || !this.tmpLocalBounds) return;
    this.containerService.container.position.copyFrom(this.containerPos);
    this.tmp.set(this.target.width, this.target.height);
    this.target.width = this.tmpLocalBounds.width;
    this.target.height = this.tmpLocalBounds.height;

    const currentPos = this.target.toLocal(event.data.global);

    this.target.width = this.tmp.x;
    this.target.height = this.tmp.y;

    const diff = this.tmp;
    diff.set(currentPos.x - this.clickedPos.x, currentPos.y - this.clickedPos.y);
    diff.x *= this.tmpXDirection;
    diff.y *= this.tmpYDirection;

    if (this.matches(HOR)) {
      this.target.width = this.clickedSize.x + diff.x;
    }
    if (this.matches(VERT)) {
      this.target.height = this.clickedSize.y + diff.y;
    }
    const bnds = this.tmpLocalBounds;
    const bound = this.tmp;
    bound.set(
      bnds.x + (bnds.width - bnds.width * this.tmpXSignBounds),
      bnds.y + (bnds.height - bnds.height * this.tmpYSignBounds)
    );
    this.containerService.container.parent.toLocal(bound, this.target, bound);
    this.containerService.container.position.x = this.containerPos.x - (bound.x - this.clickedBound.x);
    this.containerService.container.position.y = this.containerPos.y - (bound.y - this.clickedBound.y);

    this.updateCursor();
    this.emit('updated');
  }

  /**
   * Handles the mouse up event.
   *
   * Cancels the mouse handling.
   */
  mouseup(): void {
    if (!this.clickedPos) return;
    this.off('mousemove', this.mousemove, this);
    this.on('mouseover', this.updateCursor, this);
    this.on('mouseout', this.resetCursor, this);
    window.removeEventListener('mouseup', this.mouseupFn);
    this.clickedPos = null;
    this.worldTransform.applyInverse(this.service.mouse as Point, this.tmp);
    if (!this.hitArea.contains(this.tmp.x, this.tmp.y)) this.resetCursor();
    this.emit('handle:end');
  }

  /**
   * Updates the position of this anchor.
   *
   * @param bnds The bounds of the container.
   */
  update(bnds: Rectangle): void {
    this.position.set(bnds.x + bnds.width * this.offset.x, bnds.y + bnds.height * this.offset.y);
    this.rotation = this.containerService?.container.rotation || 0;
    this.parent.toLocal(this.position, this.containerService?.container, this.position);
  }
}
