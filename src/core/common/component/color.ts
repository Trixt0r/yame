import { String } from './string';
import { Number } from './number';
import { Component, define, component } from '../component';

/**
 * A component which represents a color.
 * A color can hold a hex string as a component and an alpha value as an
 * component.
 * @export
 * @class Color
 * @extends {Component<{ alpha?: Number,
 *                            hex?: String }>}
 */
@define('color')
export class Color
       extends Component<{ alpha?: Number,
                           hex?: String }> {

    /** @type {Number} alpha The transparency of the color. */
    @component alpha: Number;

    /** @type {String} hex The hex representation of this color. */
    @component hex: String;

    constructor(_name?: string,
                color = { alpha: 1, hex: 'ffffff' }) {
        super(_name, { });
        this._value.alpha = new Number('alpha', color.alpha);
        this._value.hex = new String('hex', color.hex);
    }

    /** @inheritdoc */
    get type(): string {
        return 'color';
    }
}

export default Color;