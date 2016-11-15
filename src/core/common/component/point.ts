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
}

export default Point;