import * as _ from 'underscore';

import View from './abstract';

/**
 * Button view.
 * Trigger the `click` event if clicked and enabled.
 */
export class Button extends View {

    private _disabled: boolean;
    private _active: boolean;
    private _tooltip: string;

    constructor(options = {}) {
        super(_.extend({
            tagName: 'button',
            className: 'ui button'
        }, options));
        this._disabled = false;
        this._active = false;
    }

    /**
     * Activates or deactivates this button.
     */
    set active(value: boolean) {
        this._active = value;
        this.render();
    }

    /**
     * @returns {boolean} Whether this button is activated.
     */
    get active(): boolean {
        return this._active;
    }

    /**
     * Enables or disables this button this button.
     */
    set disabled(value: boolean){
        this._disabled = value;
        this.render();
    }

    /**
     * @returns {boolean} Whether this button is enabled or disabled.
     */
    get disabled(): boolean {
        return this._disabled;
    }

    set tooltip(value: string) {
        this._tooltip = value;
        this.render();
        (<any>this.$el).popup({position: 'top right'});
    }

    /** @type {string} The tooltip of this button. */
    get tooltip(): string {
        return this._tooltip;
    }

    /** @inheritdoc */
    render(): View {
        super.render();
        if (this._disabled)
            this.$el.addClass('disabled');
        else
            this.$el.removeClass('disabled');
        if (this._active)
            this.$el.addClass('active');
        else
            this.$el.removeClass('active');
        if (this._tooltip)
            this.$el.attr('data-content', this._tooltip);
        return <any>this;
    }

    /** @inheritdoc */
    events(): Backbone.EventsHash {
        return <Backbone.EventsHash> {
           'click': (ev) => {
               if (!this._disabled)
                this.trigger('click', ev);
           }
        };
   }

   setElement(el: JQuery): View {
       super.setElement(el);
       this._disabled = this.$el.hasClass('disabled');
       return this;
   }
}

/**
 * A view containing buttons only.
 */
export class Group extends View {
    constructor(options = {}) {
        super(_.extend({
            tagName: 'div',
            className: 'ui buttons',
            activateButtons: true
        }, options));
    }

    /** @inheritdoc */
    add(button: Button, render: boolean = true): View {
        super.add(button, render);
        button.on('click', e => {
            if (this.options.activateButtons)
                this.activate(button);
            this.trigger('click', button, e);
        });
        return this;
    }

    /**
     * Activates the given button and deactivates the other buttons in the group
     * @param  {Button} button
     * @returns {void}
     */
    activate(button: Button) {
        this.views.forEach((b: Button) => b.active = false);
        button.active = true;
    }

    /**
     * Updates the button view instances with the actual DOM elements inside the
     * view's element.
     * @chainable
     */
    synchButtons(): Group {
        // Remove all current buttons
        this.subviews().forEach(view => this.delete(view, true));
        let self = this;
        this.$('>.ui.button').each(function() {
            let button = new Button( { el: $(this).get(0) } );
            self.add(button, false);
        });
        return this;
    }
}

export default Button;