import * as _ from 'underscore';

import View from './abstract';

export class Range extends View {

    private _value: number;

    constructor(options: any = {}) {
        super({
            className: 'ui range'
        });

        this.on('done:render', () => (<any>this.$el).range(_.extend({
            min: 0,
            max: 100,
            start: 50,
            onChange: value => this.trigger('change', this._value = value)
        }, options ) ));
    }

    /**
     * Sets the value of this range slider.
     * @param  {number} val
     * @returns {void}
     */
    set value(val: number) {
        (<any>this.$el).range('set value', val);
    }

    /** @returns {number} The current value of this range slider. */
    get value(): number {
        return this._value;
    }
}

export default Range;