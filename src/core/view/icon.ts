import {View} from './abstract';

import _ = require('underscore');

/**
 * Class for rendering icons.
 */
export class Icon extends View {
    constructor(options: any = {}) {
        super(_.extend({
            tagName: 'i',
            className: 'icon ' + options.iconName
        }, options));
    }

    /**
     * Changes the icon.
     * @param  {string}          iconName
     * @returns {ViewModule.View}
     */
    setIcon(iconName: string): View {
        var prevIcon = this.className.replace('icon ', '');
        this.className = 'icon ' + iconName;
        this.$el.removeClass();
        this.$el.addClass(this.className);
        this.trigger('change:icon', iconName, prevIcon);
        return this;
    }
}
