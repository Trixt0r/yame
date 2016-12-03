import { Component, define } from '../component';

/**
 * A component which can hold strings.
 * @class String
 * @extends {Component<string>}
 */
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