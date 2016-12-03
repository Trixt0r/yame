import { Component, define } from '../component';

/**
 * A component which can hold a number.
 * @class Number
 * @extends {Component<number>}
 */
@define('number')
export class Number extends Component<number> {

    /** @inheritdoc */
    get type(): string {
        return 'number';
    }

    /** @inheritdoc */
    copy(): Number {
        return new Number(this._name, this._value);
    }
}

export default Number;