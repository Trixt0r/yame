import * as _ from 'underscore';
import View from './abstract';

/**
 * A view with the tagName 'a'.
 */
export class Anchor extends View {

    constructor(options = {}) {
        super(_.extend({
            tagName: 'a',
            attributes: {
                href: 'javascript:void(0)'
            }
        }, options));
    }

    get href(): string {
        return this.$el.attr('href');
    }

    /**
     * Sets the link of this anchor.
     * The `change:href` event is triggered after this.
     * @param  {string} href [description]
     */
    set href(href: string) {
        var old = this.href;
        this.$el.attr('href', href);
        this.trigger('change:href', href, old);
    }

    /**
     * Listens for a click event on its element.
     * @returns {Backbone.EventsHash}
     */
    events(): Backbone.EventsHash {
        return <Backbone.EventsHash> {
            'click': () => this.trigger('click')
        };
    }
}

export default Anchor;