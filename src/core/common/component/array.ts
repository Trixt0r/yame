import { Component, define } from '../component';

/**
 * A component which can hold an array of arbitary values.
 * @class Array
 * @extends {Component<T[]>}
 * @template T
 */
@define('array')
export class Array<T> extends Component<T[]> {

    constructor(_name?: string, _value: T[] = []) {
        super(_name, _value);
    }

    /** @inheritdoc */
    get type(): string {
        return 'array';
    }

    /** @inheritdoc */
    copy(): Array<T> {
        return new Array<T>(this._name, this._value.slice());
    }
}

export default Array;