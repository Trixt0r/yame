import { Component, define } from '../component';

@define('array')
export class Array extends Component<Component<any>[] | any[]> {

    /** @inheritdoc */
    get type(): string {
        return 'array';
    }
}

export default Array;