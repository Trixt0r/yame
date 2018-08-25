import { Entity } from "../../../pixi/idx";
import { Point, Rectangle, Container } from "pixi.js";

const globalTopLeft = new PIXI.Point();
const globalBottomRight = new PIXI.Point();

/**
 * A rectangle like interface.
 *
 * @interface RectangleLike
 * @extends {Rectangle}
 */
interface RectangleLike extends Rectangle { }

/**
 *
 * The selection rectangle, i.e. when the user moves the mouse.
 * Provides utilities for checking collisions.
 *
 * @export
 * @class SelectionRectangle
 */
export class SelectionRectangle {

  /**
   * @type {Point} The top left point.
   */
  public topLeft: Point;

  /**
   * @type {Point} The bottom right point.
   */
  public bottomRight: Point;

  /**
   * @protected
   * @type {Rectangle} Internal rectangle object.
   */
  protected rect: Rectangle = new Rectangle();

  constructor(public container: Container,
              topLeft?: Point,
              bottomRight?: Point) {
    this.topLeft = topLeft || new Point();
    this.bottomRight = bottomRight || new Point();
  }

  /**
   * Updates the current internal dimensions based on the current pixi points.
   *
   * @returns {Rectangle}
   */
  update(): Rectangle {
    SelectionRectangle.fixRectangle(this.topLeft, this.bottomRight, this.rect);
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
   * @type {Rectangle}
   */
  get rectangle(): Rectangle {
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

  /**
   * Calculates the correct x, y, width and height properties based on the given two points.
   *
   * @param {Point} topLeft The top left point.
   * @param {Point} bottomRight The bottom right point.
   * @param {RectangleLike} [target={ }] Optional target to store the results in. E.q. your rectangle object.
   */
  static fixRectangle(topLeft: Point, bottomRight: Point, target: RectangleLike = <any>{ }): RectangleLike {
    const x = topLeft.x < bottomRight.x ? topLeft.x : bottomRight.x;
    const y = topLeft.y < bottomRight.y ? topLeft.y : bottomRight.y;
    const width = Math.abs(topLeft.x - bottomRight.x);
    const height = Math.abs(topLeft.y - bottomRight.y);
    target.x = x; target.y = y;
    target.width = width; target.height = height;
    return target;
  }

}
