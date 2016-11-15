import {Component, define, component } from '../../../common/component';
import { Number } from '../../../common/component/number';
import { Point } from '../../../common/component/point';

@define('transformation')
export class Transformation extends Component<any> {

    /** @type {Point} position The position of the transformation. */
    @component position: Point;

    /** @type {Point} scale The scale of the transformation. */
    @component scale: Point;

    /** @type {Point} skew The skew of the transformation. */
    @component skew: Point;

    /** @type {Number} rotation The roation of the transformation. */
    @component rotation: Number;

    constructor(protected _name ? : string) {
        super(_name, { });
        this._value.position = new Point('position');
        this._value.scale = new Point('scale');
        this._value.skew = new Point('skew');
        this._value.rotation = new Number('rotation', 0);
    }

    /** @inheritdoc */
    get type(): string {
        return 'transformation';
    }
}