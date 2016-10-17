import * as Utils from './utils';

import DropHandler from './handler';
import Payload from './payload';
import View from '../../renderer/view/abstract';

/**
 * A drop manager is bound to a specific DOM element and
 */
export class Manager {

    protected _handlers: DropHandler[];
    protected _$el: JQuery;
    private _over: any;
    private _enter: any;
    private _leave: any;
    private _drop: any;

    constructor(element: View | JQuery) {
        this._handlers = [];
        // Keep reference of the event handlers to be able unbind them again
        this._over = this.over.bind(this);
        this._enter = this.enter.bind(this);
        this._leave = this.leave.bind(this);
        this._drop = this.drop.bind(this);
        this.element = element;
    }

    /**
     * Sets the element of this drophandler.
     * @param  {View | JQuery} element The view or jquery element to listen for
     * drag and drop events. If a view is supplied and the bound jQuery instance
     * changes for that view the manager re-binds it's event handlers, too.
     * @returns {void}
     */
    set element(element: View | JQuery) {
        this.unbind();
        if (element instanceof View) {
            element.off(null, null, this);
            this._$el = element.$el;
            element.on('change:element', $el => {
                this.unbind();
                this._$el = $el;
                this.bind();
            });
        } else this._$el = element;
        this.bind();
    }

    /**
     * Same as setting the `element` property
     * @param  {JQuery} $el
     * @returns {void}
     */
    set $el($el: JQuery) {
        this.element = $el;
    }

    /** @returns {JQuery} The jQuery instance this manager is bound to. */
    get $el(): JQuery {
        return this._$el;
    }

    /**
     * Adds a drop handler to this manager.
     * The drop handler is only added if not added yet.
     * @param  {DropHandler} handler
     * @chainable
     */
    add(handler: DropHandler): Manager {
        let idx = this._handlers.indexOf(handler);
        if (idx >= 0) return this;
        this._handlers.push(handler);
        return this;
    }

    /**
     * Removes the given drop handler from this manager.
     * @param  {DropHandler} handler
     * @returns {DropManager}
     */
    remove(handler: DropHandler): Manager {
        let idx = this._handlers.indexOf(handler);
        if (idx >= 0) this._handlers.splice(idx, 1);
        return this;
    }

    /**
     * Reads the payloads from the given event and delegates them to the
     * registered handlers, if supported.
     * @param  {JQueryEventObject} e
     * @param  {string}            fnName
     * @returns {void}
     */
    private delegate(e: JQueryEventObject, fnName: string) {
        Utils.payloadsFromEvent(e).forEach(payload => {
            this._handlers.forEach(handler => {
                if (Utils.supported(handler, payload))
                    handler[fnName].call(handler, payload, e);
            });
            e.preventDefault();
        });
    }

    /** @returns {void} `dragenter` event handler for the current set element. */
    protected enter(e: JQueryEventObject) {
        this.delegate(e, 'enter');
        e.preventDefault();
    }

    /** @returns {void} `dragover` event handler for the current set element. */
    protected over(e: JQueryEventObject) { e.preventDefault(); }

    /** @returns {void} `dragleave` event handler for the current set element. */
    protected leave(e: JQueryEventObject) { this.delegate(e, 'leave'); }

    /** @returns {void} `drop` event handler for the current set element. */
    protected drop(e: JQueryEventObject) {
        this.delegate(e, 'process');
        Utils.clearPayload();
    }

    /** @returns {void} */
    protected bind() {
        this._$el.bind('dragover', this._over);
        this._$el.bind('dragenter', this._enter);
        this._$el.bind('dragleave', this._leave);
        this._$el.bind('drop', this._drop);
    }

    /**
     * Unbinds all previous registered event handlers from the current element.
     * @returns {void}
     */
    protected unbind() {
        if (!this._$el) return;
        this._$el.unbind('dragover', this._over);
        this._$el.unbind('dragenter', this._enter);
        this._$el.unbind('dragleave', this._leave);
        this._$el.unbind('drop', this._drop);
    }
}

export default Manager;