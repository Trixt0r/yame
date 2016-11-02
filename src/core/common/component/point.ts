import { Components } from '../components';
import { Component, define } from '../component';

@define('point')
export class Point extends Components {

    constructor(_name?: string, point: {x: number, y: number} = {x: 0, y: 0}) {
        super(_name);
        this._value.x = point.x;
        this._value.y = point.y;
    }

    /** @inheritdoc */
    get type(): string {
        return 'point';
    }
}

export default Point;