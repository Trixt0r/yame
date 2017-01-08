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
}

export default String;