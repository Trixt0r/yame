import { String } from './string';
import { Number } from './number';
import { Component, define, component } from '../component';

@define('color')
export class Color extends Component<any> {

    /** @type {Number} alpha The transparency of the color. */
    @component alpha: Number;

    /** @type {String} hex The hex representation of this color. */
    @component hex: String;

    constructor(_name?: string) {
        super(_name, { });
        this._value.alpha = new Number('alpha', 1);
        this._value.hex = new String('hex', 'ffff');
    }

    /** @inheritdoc */
    get type(): string {
        return 'color';
    }
}

export default Color;