import EventBus from '../../common/eventbus';

/**
 * Observable version of a point. Triggers `change:x` or `change:y` events.
 * @export
 * @class Point
 * @extends {EventBus}
 */
export class Point extends EventBus {
    private _x: number;
    private _y: number;

    constructor(x: number = 0, y: number = 0) {
        super();
        this._x = x;
        this._y = y;
    }

    set x(val: number) {
        var prev = this._x;
        this._x = val;
        if (prev !== val)
            (<EventBus><any>this).trigger('change:x', val);
    }

    get x(): number {
        return this._x;
    }

    set y(val: number) {
        var prev = this._y;
        this._y = val;
        if (prev !== val)
            (<EventBus><any>this).trigger('change:y', val);
    }

    get y(): number {
        return this._y;
    }

    set(x: number, y:number) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Wrapper class for any PIXI.DisplayObject instance to enable the possibility
 * to trigger events as soon a change happened to a component.
 * @export
 * @class Observer
 * @extends {EventBus}
 */
export class Observer<E extends PIXI.DisplayObject> extends EventBus {

    protected _position: Point;
    protected _scale: Point;
    protected _rotation: number;
    protected _target: E;

    constructor(target: E) {
        super();
        this._position = new Point();
        this._scale = new Point();
        this._rotation = 0;
        this.target = target;
        this.position.on('change:x', val => {
            this._target.position.x = val;
            this.trigger('change:position.x', val);
        });
        this.position.on('change:y', val => {
            this._target.position.y = val;
            this.trigger('change:position.y', val);
        });
        this.scale.on('change:x', val => {
            this._target.scale.x = val;
            this.trigger('change:scale.x', val);
        });
        this.scale.on('change:y', val => {
            this._target.scale.y = val;
            this.trigger('change:scale.y', val);
        });
    }

    get target(): E {
        return this._target;
    }

    set target(target: E) {
        if (!target) throw 'Target of an observer can not be null!';
        this._target = target;
        this.position.set(target.position.x, target.position.y);
        this.scale.set(target.scale.x, target.scale.y);
        this.rotation = target.rotation;
        this.trigger('change:target', target);
    }

    get position() {
        return this._position;
    }

    set position(val: any) {
        if (val instanceof Point)
            this._position = val;
        else
            this._position = new Point(val.x, val.y);
        this._target.position.set(this._scale.x, this._scale.y);
        (<EventBus><any>this).trigger('change:position', this._position);
    }

    get scale() {
        return this._scale;
    }

    set scale(val: any) {
        if (val instanceof Point)
            this._scale = val;
        else
            this._scale = new Point(val.x, val.y);
        this._target.scale.set(this._scale.x, this._scale.y);
        (<EventBus><any>this).trigger('change:scale', this._scale);
    }

    get rotation():number {
        return this._rotation;
    }

    set rotation(val: number) {
        var prev = this._rotation;
        this._rotation = val;
        if (prev !== val) {
            (<EventBus><any>this).trigger('change:rotation', val);
            this._target.rotation = val;
        }
    }
}

export default Observer;