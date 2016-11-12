import * as Backbone from 'backbone';
import EventBus from '../../common/eventbus';


var Pubsub: Backbone.Events = <any>Backbone.Events;

var localTargetPosition = new PIXI.Point();

/**
 * A camera is responsible for updating the users view correctly.
 */
export class Camera extends EventBus {

    private _zoom: number;
    private _container: PIXI.DisplayObject;
    private _minZoom: number;
    private _maxZoom: number;
    public targetPosition: PIXI.Point;
    public zoomStep: number;

    constructor() {
        super();
        this._zoom = 1;
        this._minZoom = 0.1;
        this._maxZoom = 3;
        this.targetPosition = new PIXI.Point();
        this.zoomStep = 0.03;
    }

    /**
     * Attaches this camera to the given container.
     * @param  {PIXI.DisplayObject} container
     * @chainable
     */
    attach(container: PIXI.DisplayObject) {
        this._zoom = Math.max(container.scale.x, container.scale.y);
        this._container = container;
        return this;
    }

    /**
     * Detaches this camera from the current container.
     * @chainable
     */
    detach() {
        this._zoom = 1;
        this._container = null;
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
            (<any>this._container).toLocal(this.targetPosition, null, localTargetPosition);
            this._zoom += (<any>Math).sign(diff) * Math.min(this.zoomStep, diffAbs);
            this._container.scale.set(this._zoom);
            this._container.position.x = -(localTargetPosition.x * this._zoom) + this.targetPosition.x;
            this._container.position.y = -(localTargetPosition.y * this._zoom) + this.targetPosition.y;
            this.trigger('update');
            Pubsub.trigger('camera:update', this);
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
            this.zoomStep = this._maxZoom - this._zoom;
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
        return this._container.position;
    }
}

export default Camera;