import {View} from './abstract';

import _ = require('underscore');

export class Label extends View {

    constructor (options: any = {}) {
        super(_.extend({
            className: 'ui label',
            tagName: 'label'
        }, options));

        if (options.text)
            this.text = options.text;
    }

    /**
     * Sets the text of this label.
     * @param  {string} val
     * @returns {void}
     */
    set text(val: string) {
        this.$el.text(val);
        this.trigger('change:text');
    }

    /** @returns {string} The text of this label.  */
    get text(): string {
        return this.$el.text();
    }
}
