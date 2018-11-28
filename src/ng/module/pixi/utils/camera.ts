import EventEmitter from '../../../../common/event-emitter';

import * as PIXI from 'pixi.js';

/**
 * A camera is responsible for updating the users view correctly.
 */
export class Camera extends EventEmitter {

  private _zoom: number;
  private _container: PIXI.DisplayObject;
  private _minZoom: number;
  private _maxZoom: number;
  public targetPosition: PIXI.Point;
  public zoomStep: number;
  private localTargetPosition: PIXI.Point;

  constructor() {
    super();
    this._container = null;
    this._zoom = 1;
    this._minZoom = 0.05;
    this._maxZoom = 3;
    this.targetPosition = new PIXI.Point();
    this.localTargetPosition = new PIXI.Point();
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
   * @param {PIXI.DisplayObject} container
   * @chainable
   */
  attach(container: PIXI.DisplayObject) {
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
   * @chainable
   */
  detach() {
    if (!this._container) return this;
    this._zoom = 1;
    const prev = this._container;
    this._container = null;
    prev.emit('camera:detached', this);
    return this;
  }

  /** @returns {PIXI.DisplayObject} The container this camera is attached to. */
  get container(): PIXI.DisplayObject {
    return this._container;
  }

  /** @returns {boolean} Whether this camera is attached to a container. */
  isAttached(): boolean {
    return this._container !== null;
  }

  /**
   * Sets the zoom of this camera to the given value.
   * The zoom value will not be set immediately to the given value.
   * The resulting value of the camera's zoom depends on the current set
   * Camera#zoomStep.
   * Idea taken from
   * http://stackoverflow.com/questions/29035084/zoom-to-cursor-position-pixi-js
   * @param  {number} target
   * @returns {void}
   */
  set zoom(target: number) {
    if (!this.isAttached()) return;
    target = Math.max(Math.min(this._maxZoom, target), this._minZoom);
    var diff = target - this._zoom;
    var diffAbs = Math.abs(diff);
    if (diffAbs > 0) {
      this._container.toLocal(this.targetPosition, null, this.localTargetPosition);
      this._zoom += Math.sign(diff) * Math.min(this.zoomStep, diffAbs);
      this._container.scale.set(this._zoom);
      this._container.position.x = -(this.localTargetPosition.x * this._zoom) + this.targetPosition.x;
      this._container.position.y = -(this.localTargetPosition.y * this._zoom) + this.targetPosition.y;
      this.emit('updated');
    }
  }

  /** @returns {number} The current zoom value. */
  get zoom(): number {
    return this._zoom;
  }

  /**
   * Sets the max. possible zoom value for this camera.
   * @param  {number} value
   * @returns {void}
   */
  set maxZoom(value: number) {
    this._maxZoom = value;
    // Make sure the current zoom won't exceed the new maximum value
    if (this._zoom > this._maxZoom) {
      var prevStep = this.zoomStep;
      this.zoomStep = this._zoom - this._maxZoom;
      this.zoom = this._maxZoom;
      this.zoomStep = prevStep;
    }
  }

  /** @returns {number} The current max. zoom value possible */
  get maxZoom(): number {
    return this._maxZoom;
  }

  /**
   * Sets the min. possible zoom value for this camera.
   * @param  {number} value
   * @returns {void}
   */
  set minZoom(value: number) {
    this._minZoom = value;
    // Make sure the current zoom won't exceed the new minimum value
    if (this._zoom < this._minZoom) {
      var prevStep = this.zoomStep;
      this.zoomStep = this._minZoom - this._zoom;
      this.zoom = this._minZoom;
      this.zoomStep = prevStep;
    }
  }

  /** @returns {number} The current min. zoom value possible */
  get minZoom(): number {
    return this._minZoom;
  }

  /** @returns {PIXI.Point} Shortcut for `container.position` */
  get position(): PIXI.Point {
    return <PIXI.Point>this._container.position;
  }

  /**
   * Sets the position of this camera, i.e. shifts the container this camera is attached to.
   * @param  {number} value
   * @returns {void}
   */
  set position(pos: PIXI.Point) {
    if (this.position.x != pos.x || this.position.y != pos.y) {
      this._container.position.set(pos.x, pos.y);
      this.emit('updated');
    }
  }
}

export default Camera;
