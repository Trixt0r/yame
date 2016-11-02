import EventBus from '../../../core/common/eventbus';
import Button from '../gui/tools/button';
import Tools from '../gui/tools';

import * as keyboardjs from 'keyboardjs';

const Pubsub = require('backbone').Events;


export abstract class Tool extends EventBus {
    protected _tools: Tools

    constructor() {
        super();
        this.on('added', tools => this._tools = tools);
        this.on('removed', tools => this._tools = void 0);
    }

    /**
     * @returns {Button} The button wich has to be attached to the toolbar.
     */
    abstract getButton(): Button;

    /**
     * @private Helper for delegating events.
     * @param {Function} [fn]
     * @returns
     * @memberOf Tool
     */
    private delegate(fn?: Function) {
        if (!fn) return;
        let self = this;
        return function() {
            if (!self._tools) return; // Skip if tools has not been set yet
            // Only run the handler if this tool is active
            if (self._tools.isActive(self))
                fn.apply(this, arguments);
        }
    }

    /**
     * Registers the given event handler for the given event on the given
     * element. The handler is only executed if this tool is selected.
     * @param  {JQuery|String} $el JQuery element or the selector.
     * @param  {String}   event The name of the event
     * @param  {Function} fn The event handler
     * @returns {void}
     */
    handle($el: any, event: String, fn: Function) {
        if (typeof $el == 'string') $el = $($el);
        if (!$el)
            Pubsub.on(event, this.delegate(fn));
        else
            $el.on(event, this.delegate(fn));
    }

    /**
     * Binds the given handlers to the given keyboard command.
     * Provided handlers will be executed if this tool is active and the PixiJS
     * canvas has focus.
     * @param {string} command
     * @param {Function} [fnDown]
     * @param {Function} [fnUp]
     */
    keyboard(command: string, fnDown?: Function, fnUp?: Function) {
        let helper = (fn) => {
            if (!fn) return;
            return () => {
                let f = this.delegate(fn);
                if (this._tools.hasKeyboardFocus && f)
                    return f();
            }
        }
        keyboardjs.bind(command, helper(fnDown), helper(fnUp));
    }
}

export default Tool;