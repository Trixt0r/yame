import {View} from './abstract';

import _ = require('underscore');

/**
 * A view with the tagName `img`
 */
export class Image extends View {
    constructor(options: any = {}) {
        super(_.extend({
            tagName: 'img',
            className: 'ui image'
        }, options));
    }

    /**
     * Sets the source of this image.
     * The `change:src` event is triggered after this.
     * @param  {string} source URL
     */
    set src(source: string) {
        var old = this.src;
        this.$el.attr('src', source);
        this.trigger('change:src', old, source);
    }

    /**
     * @returns {string} Current source of this image view.
     */
    get src(): string {
        return this.$el.attr('src');
    }

    /**
     * Sets the width of this image.
     * The `change:width` event is triggered after this.
     * @param  {number} width
     */
    set width(width: number) {
        var old = this.$el.attr('width');
        this.$el.attr('width', width);
        this.trigger('change:width', old, width);
    }

    /**
     * @returns {number} The width of this image.
     */
    get width():number {
        return parseFloat(this.$el.attr('width'));
    }

    /**
     * Sets the height of this image.
     * The `change:height` event is triggered after this.
     * @param  {number} height
     */
    set height(height: number) {
        var old = this.$el.attr('height');
        this.$el.attr('height', height);
        this.trigger('change:height', old, height);
    }

    /**
     * @returns {number} The height of this image.
     */
    get height():number {
        return parseFloat(this.$el.attr('height'));
    }
}
