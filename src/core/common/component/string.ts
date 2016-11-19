import { Component, define } from '../component';

@define('string')
export class String extends Component<string> {

    /** @inheritdoc */
    get type(): string {
        return 'string';
    }

    /** @inheritdoc */
    copy(): String {
        return new String(this._name, this._value);
    }
}

export default String;