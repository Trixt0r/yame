import { Component, define } from '../component';

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