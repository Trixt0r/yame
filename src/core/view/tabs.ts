import { View } from './abstract';
import { Anchor } from './anchor';

import * as _ from 'underscore';


class Pair {
    anchor: Anchor;
    content: Content;
}

/**
 * Views for a tab menu.
 */
export class Menu extends View {

    private pairs: Pair[];

    constructor() {
        super({
            className: 'ui top attached tabular menu'
        });
        this.pairs = [];
        this.on('done:render', function() {
            (<any>$('.menu .item')).tab();
        });
    }

    /**
     * Adds a new tab index to the menu.
     * @param  {string}  index The tab reference to open on click.
     * @param  {Content} content Optional content view to link it to the anchor.
     * @returns {Pair} The added pair containig the anchor at least.
     */
    tab(index: string, content?: Content): Anchor {
        let anchor = new Anchor({
            attributes: {
                'data-tab': index
            },
            className: 'item'
        });
        let pair = new Pair();
        this.pairs.push(pair);
        pair.anchor = anchor;
        this.add(anchor);
        if (content) {
            content.anchor = anchor;
            pair.content = content;
            if (this.parent)
                this.parent.add(content);
        }
        (<any>this.$('.item')).tab();
        // (<any>$('.menu .item')).tab();
        return anchor;
    }

    /**
     * @param  {string} index The value of the `data-tab` attribute.
     * @returns {Pair}
     */
    get(index: string): Pair {
        return _.find(this.pairs, pair => pair.anchor.$el.attr('data-tab') == index );
    }
}


/**
 * A tab view.
 */
export class Content extends View {

    private _anchor: Anchor;

    constructor(options: any = {}) {
        super(_.extend({className: 'ui bottom attached tab segment'}, options));

        // this.on('done:render', function() {
        //     (<any>$('.menu .item')).tab();
        // });
    }

    /**
     * Sets the anchor of this tab view.
     * Triggers `change:anchor` on this view.
     * @param  {Anchor} anchor
     * @returns {void}
     */
    set anchor(anchor: Anchor) {
        this._anchor = anchor;
        this.$el.attr('data-tab', anchor.$el.attr('data-tab'));
        this.trigger('change:anchor');
        this.trigger('done:render');
    }

    /** @returns {Anchor} The current set anchor. */
    get anchor(): Anchor {
        return this._anchor;
    }

    /**
     * Activates this tab.
     * @param  {boolean} val
     * @returns {void}
     */
    set active(val: boolean) {
        if (this.active) return;
        this.anchor.$el.parent().find('a.item.active').removeClass('active');
        this.$el.parent().find('.tab.segment.active').removeClass('active');
        this.$el.addClass('active');
        this.anchor.$el.addClass('active');
    }

    /**
     * @returns {boolean} Whether this tab is active or not.
     */
    get active(): boolean {
        return this.$el.hasClass('active');
    }
}
