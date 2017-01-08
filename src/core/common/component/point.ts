import { Number } from './number';
import { Component, define, component } from '../component';

/**
 * A component which represents a 2d point.
 * A point can hold an x and an y component.
 * @class Point
 * @extends {Component<{ x?: Number,
 *                            y?: Number }>}
 */
@define('point')
export class Point
       extends Component<{ x?: Number,
                           y?: Number }> {

    /** @type {Number} x The x coordinate of the point. */
    @component x: Number;

    /** @type {Number} y The y coordinate of the point. */
    @component y: Number;

    constructor(_name?: string,
                point: { x: number, y: number } =
                       { x: 0, y: 0 }) {
        super(_name, { });
        this._value.x = new Number('x', point.x);
        this._value.y = new Number('y', point.y);
    }

    /** @inheritdoc */
    get type(): string {
        return 'point';
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