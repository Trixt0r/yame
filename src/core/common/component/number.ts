import { Component, define } from '../component';

@define('number')
export class Number extends Component<number> {

    /** @inheritdoc */
    get type(): string {
        return 'number';
    }
}

export default Number;