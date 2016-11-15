import { Component, define } from '../component';

@define('array')
export class Array<T> extends Component<Component<T>[] | T[]> {

    constructor(_name?: string, _value: T[] = []) {
        super(_name, _value);
    }

    /** @inheritdoc */
    get type(): string {
        return 'array';
    }
}

export default Array;