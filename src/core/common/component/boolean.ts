import { Component, define } from '../component';

@define('boolean')
export class Boolean extends Component<boolean> {

    /** @inheritdoc */
    get type(): string {
        return 'boolean';
    }
}

export default Boolean;