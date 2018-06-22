import { Entity } from "../../../pixi/idx";

const globalTopLeft = new PIXI.Point();
const globalBottomRight = new PIXI.Point();

export class SelectionRectangle {

  public topLeft: PIXI.Point;
  public bottomRight: PIXI.Point;

  private rect = new PIXI.Rectangle();

  constructor(public container: PIXI.Container,
              topLeft?: PIXI.Point,
              bottomRight?: PIXI.Point) {
    this.topLeft = topLeft || new PIXI.Point();
    this.bottomRight = bottomRight || new PIXI.Point();
  }

  /**
   * Updates the current internal dimensions based on the current pixi points.
   *
   * @returns {PIXI.Rectangle}
   */
  update(): PIXI.Rectangle {
    const x = this.topLeft.x < this.bottomRight.x ? this.topLeft.x : this.bottomRight.x;
    const y = this.topLeft.y < this.bottomRight.y ? this.topLeft.y : this.bottomRight.y;
    const width = Math.abs(this.topLeft.x - this.bottomRight.x);
    const height = Math.abs(this.topLeft.y - this.bottomRight.y);
    this.rect.x = x; this.rect.y = y;
    this.rect.width = width; this.rect.height = height;
    return this.rect;
  }

  /**
   * Resets the dimensions of the internal rectangle.
   */
  reset(): void {
    this.topLeft.set(Infinity);
    this.bottomRight.set(Infinity);
    this.rect.width = -1;
    this.rect.height = -1;
  }

  /**
   * The pixi rectangle for this selection rectangle.
   *
   * @readonly
   * @type {PIXI.Rectangle}
   */
  get rectangle(): PIXI.Rectangle {
    return this.rect;
  }

  /**
   * Checks whether the given entity lies within this rectangle
   *
   * @param {Entity} entity
   * @returns {boolean}
   */
  contains(entity: Entity): boolean {
    this.container.toGlobal(this.topLeft, globalTopLeft);
    this.container.toGlobal(this.bottomRight, globalBottomRight);
    if (entity.containsPoint(globalTopLeft) || entity.containsPoint(globalBottomRight)) return true;
    const bounds = entity.getShape();
    if (!bounds) return false;
    const rect = this.rect;
    if (bounds instanceof PIXI.Rectangle || bounds instanceof PIXI.RoundedRectangle) {
      let topLeft = this.container.toLocal(new PIXI.Point(bounds.x, bounds.y), entity);
      if (rect.contains(topLeft.x, topLeft.y)) return true;
      let topRight = this.container.toLocal(new PIXI.Point(bounds.x + bounds.width, bounds.y), entity);
      if (rect.contains(topRight.x, topRight.y)) return true;
      let bottomLeft = this.container.toLocal(new PIXI.Point(bounds.x, bounds.y + bounds.height), entity);
      if (rect.contains(bottomLeft.x, bottomLeft.y)) return true;
      let bottomRight = this.container.toLocal(new PIXI.Point(bounds.x + bounds.width, bounds.y + bounds.height), entity);
      if (rect.contains(bottomRight.x, bottomRight.y)) return true;
    }
    return false;
  }

}
