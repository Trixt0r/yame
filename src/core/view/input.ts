import {Bindable} from './bindable';

import Backbone = require('backbone');
import _ = require('underscore');

let prevEvent = null;
let prevVal = null;

let mousemove = function(e: JQueryEventObject) {
    if (prevEvent) {
        if (!isNaN(prevVal)) {
            e.preventDefault();
            e.stopPropagation();
            let diff = prevEvent.clientY - e.clientY;
            $(prevEvent.target).val(prevVal + diff);
            $(prevEvent.target).change();
        }
    }
}

let mouseup = function() {
    prevEvent = null;
}

export class Input extends Bindable {

    constructor(options: any = {}) {
        super(_.extend({
            attributes: {
                type: options.type || 'text',
                value: options.value,
                placeholder: options.placeholder
            },
            tagName: 'input'
        }, options));
        $('body').off('mousemove', mousemove);
        $('body').off('mouseup', mouseup);
        $('body').on('mousemove', mousemove);
        $('body').on('mouseup', mouseup);
    }

    /**
     * @returns {string} The type of this input view.
     */
    get type(): string {
        return this.$el.attr('type');
    }

    /**
     * Sets the value of this input view.
     * @param  {string} val The new type.
     * @returns {void}
     */
    set type(val: string) {
        this.$el.attr('type', val);
    }

    /**
     * @returns {string} The type of this input view.
     */
    get placeholder(): string {
        return this.$el.attr('placeholder');
    }

    /**
     * Sets the value of this input view.
     * @param  {string} val The new placeholder
     * @returns {void}
     */
    set placeholder(val: string) {
        this.$el.attr('placeholder', val);
    }

    /**
     * @returns {string} The current value of this input.
     */
    get value(): string {
        return this.$el.val();
    }

    /**
     * Sets the value of this input.
     * @param  {string} val
     * @returns {void}
     */
    set value(val: string) {
        this.$el.val(val);
    }

    /**
     * @returns {string} The current name if this input;
     */
    get name(): string {
        return this.$el.attr('name');
    }

    /**
     * Sets the name of this input.
     * @param  {string} val
     * @returns {void}
     */
    set name(val: string) {
        this.$el.attr('name', val);
    }

    /** @inheritdoc */
    events(): Backbone.EventsHash {
        var parentEvents = super.events();
        return <Backbone.EventsHash> _.extend(parentEvents, {
            'mousedown':  e => {
                prevEvent = e;
                prevVal = parseFloat(this.$el.val());
                this.$el.change();
            }
        });
    }

    /**
     * Disables this view.
     * @chainable
     */
    disable() {
        if (!this.isDisabled()) {
            this.$el.attr('disabled', 'disabled');
            this.trigger('disabled');
        }
    }

    /**
     * Enables this view.
     * @chainable
     */
    enable() {
        if (this.isDisabled()) {
            this.$el.removeAttr('disabled');
            this.trigger('enabled');
        }
    }

    /** @returns {boolean} Whether this view is disabled or not. */
    isDisabled(): boolean {
        return this.$el.attr('disabled') !== void 0;
    }

}
