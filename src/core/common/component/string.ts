import { Component, define } from '../component';

@define('string')
export class String extends Component<string> {

    /** @inheritdoc */
    get type(): string {
        return 'string';
    }
}

export default String;