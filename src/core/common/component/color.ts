import { Components } from '../components';
import { Component, define } from '../component';

@define('color')
export class Color extends Components {

    constructor(_name?: string) {
        super(_name);
        this._value.alpha = 1;
        this._value.hex = 'ffff';
    }

    /** @inheritdoc */
    get type(): string {
        return 'color';
    }
}

export default Color;