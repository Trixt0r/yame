import { Component, define } from '../component';

@define('boolean')
export class Boolean extends Component<boolean> {

    /** @inheritdoc */
    get type(): string {
        return 'boolean';
    }

    /** @inheritdoc */
    copy(): Boolean {
        return new Boolean(this._name, this._value);
    }
}

export default Boolean;