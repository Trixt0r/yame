import EventEmitter from '../../../../common/event-emitter';

import { DisplayObject, Point } from 'pixi.js';

/**
 * A camera is responsible for updating the users view correctly.
 */
export class Camera extends EventEmitter {

  /**
   * The target position.
   * The coordinate space should be the one of the attached container's parent.
   */
  public targetPosition: Point;

  /**
   * The zoom step value, i.e. how fast the camera zooms to the set value.
   */
  public zoomStep: number;

  /**
   * The current bound container.
   */
  protected _container: DisplayObject;

  /**
   * Internal zoom value.
   */
  protected _zoom: number;

  /**
   * Internal min zoom value.
   */
  protected _minZoom: number;

  /**
   * Internal max zoom value.
   */
  protected _maxZoom: number;

  /**
   * Internal local target position.
   */
  protected localTargetPosition: Point;

  constructor() {
    super();
    this._container = null;
    this._zoom = 1;
    this._minZoom = 0.05;
    this._maxZoom = 3;
    this.targetPosition = new Point();
    this.localTargetPosition = new Point();
    this.zoomStep = 0.03;
    this.on('updated', () => {
      if (!this._container) return;
      this._container.emit('camera:updated', this);
    });
  }

  /**
   * Attaches this camera to the given container.
   *
   * Triggers the `camera:attached` event on the given container.
   * If a container is already is set, it will be detached before.
   *
   * @param container
   * @returns This instance, useful for chaining.
   */
  attach(container: DisplayObject): Camera {
    if (this._container) this.detach();
    this._zoom = Math.max(container.scale.x, container.scale.y);
    this._container = container;
    this._container.emit('camera:attached', this);
    return this;
  }

  /**
   * Detaches this camera from the current container, if this camera is attached to any.
   *
   * Triggers the `camera:detached` event on the current container.
   *
   * @returns This instance, useful for chaining.
   */
  detach(): Camera {
    if (!this._container) return this;
    this._zoom = 1;
    const prev = this._container;
    this._container = null;
    prev.emit('camera:detached', this);
    return this;
  }

  /**
   * The container this camera is attached to.
   */
  get container(): PIXI.DisplayObject {
    return this._container;
  }

  /**
   * Whether this camera is attached to a container.
   */
  isAttached(): boolean {
    return this._container !== null;
  }

  /**
   * Sets the zoom of this camera to the given value.
   * The zoom value will not be set immediately to the given value.
   * The resulting value of the camera's zoom depends on the current set
   * Camera#zoomStep.
   *
   * Idea taken from
   * http://stackoverflow.com/questions/29035084/zoom-to-cursor-position-pixi-js
   * @param target
   */
  set zoom(target: number) {
    if (!this.isAttached()) return;
    target = Math.max(Math.min(this._maxZoom, target), this._minZoom);
    const diff = target - this._zoom;
    const diffAbs = Math.abs(diff);
    if (diffAbs > 0) {
      this._container.toLocal(this.targetPosition, null, this.localTargetPosition);
      this._zoom += Math.sign(diff) * Math.min(this.zoomStep, diffAbs);
      this._container.scale.set(this._zoom);
      this._container.position.x = -(this.localTargetPosition.x * this._zoom) + this.targetPosition.x;
      this._container.position.y = -(this.localTargetPosition.y * this._zoom) + this.targetPosition.y;
      this.emit('updated');
    }
  }

  /**
   * The current zoom value.
   */
  get zoom(): number {
    return this._zoom;
  }

  /**
   * Sets the max. possible zoom value for this camera.
   *
   * @param value
   */
  set maxZoom(value: number) {
    this._maxZoom = value;
    // Make sure the current zoom won't exceed the new maximum value
    if (this._zoom > this._maxZoom) {
      const prevStep = this.zoomStep;
      this.zoomStep = this._zoom - this._maxZoom;
      this.zoom = this._maxZoom;
      this.zoomStep = prevStep;
    }
  }

  /**
   * The current max. zoom value possible
   */
  get maxZoom(): number {
    return this._maxZoom;
  }

  /**
   * Sets the min. possible zoom value for this camera.
   * @param value
   */
  set minZoom(value: number) {
    this._minZoom = value;
    // Make sure the current zoom won't exceed the new minimum value
    if (this._zoom < this._minZoom) {
      const prevStep = this.zoomStep;
      this.zoomStep = this._minZoom - this._zoom;
      this.zoom = this._minZoom;
      this.zoomStep = prevStep;
    }
  }

  /**
   * The current min. zoom value possible.
   */
  get minZoom(): number {
    return this._minZoom;
  }

  /**
   * The container position.
   */
  get position(): Point {
    return this._container.position;
  }

  /**
   * Sets the position of this camera, i.e. shifts the container this camera is attached to.
   */
  set position(pos: Point) {
    if (this.position.x !== pos.x || this.position.y !== pos.y) {
      this._container.position.set(pos.x, pos.y);
      this.emit('updated');
    }
  }
}

export default Camera;
