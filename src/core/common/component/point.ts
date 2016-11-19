import { Number } from './number';
import { Component, define, component } from '../component';

@define('point')
export class Point extends Component<any> {

    /** @type {Number} x The x coordinate of the point. */
    @component x: Number;

    /** @type {Number} y The y coordinate of the point. */
    @component y: Number;

    constructor(_name?: string, point: {x: number, y: number} = {x: 0, y: 0}) {
        super(_name, { });
        this._value = { };
        this._value.x = new Number('x', point.x);
        this._value.y = new Number('y', point.y);
    }

    /** @inheritdoc */
    get type(): string {
        return 'point';
    }

    /** @inheritdoc */
    copy(): Point {
        let copy = new Point(this._name);
        copy.value.x = this.x.copy();
        copy.value.y = this.y.copy();
        return copy;
    }

    /**
     * Applies the current values to the given PIXI point.
     *
     * @param {PIXI.Point} point
     * @chainable
     */
    apply(point: PIXI.Point): Point {
        point.set(this.x.value, this.y.value);
        return this;
    }

    /**
     * Applies the given PIXI point to this component.
     *
     * @param {PIXI.Point} point
     * @chainable
     */
    sync(point: PIXI.Point): Point {
        this.x.value = point.x;
        this.y.value = point.y;
        return this;
    }
}

export default Point;