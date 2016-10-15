import {EventBus} from '../eventbus';
import {Editable} from '../editable';
import {Css} from './css';
import {Template} from '../backend/template';

import Backbone = require('backbone');
import _ = require('underscore');

var randomstring = require("randomstring");

/**
 * Base class for any view.
 */
export class View extends Backbone.View<Backbone.Model> {

    protected template: Template;
    protected views: View[];
    protected _cid: string;
    protected $childContainer: JQuery;
    protected _options: any;
    protected _parent: View;
    protected _css: Css;

    constructor(options: any  = {}) {
        super(_.extend({ attributes: {} } , options));
        if (options.id) {
            this._cid = options.id;
            this.setElement($('#' + options.id));
        }
        else {
            options.id = 'V'+randomstring.generate(10);
            this._cid = options.id;
        }
        this._options = options;
        this.$childContainer = this.$el;
        this._css = new Css(this.attributes.style);
        this._css.on('change:*', (varName, value, prev) => {
            this.trigger('change:css:*', varName, value, prev);
            this.trigger(`change:css:${varName}`, value, prev);
        })
        this.views = [];
    }

    /**
     * @returns {any} The options passed during instantiation.
     */
    get options(): any {
        return this._options;
    }

    /** @returns {string} The cid of this view instance. */
    get cid(): string {
        return this._cid;
    }

    /** @returns {View} The parent view or `null` if not a subview. */
    get parent(): View {
        return this._parent;
    }

    /**
     * @param  {string} filePath
     * @chainable
     */
    setTemplate(filePath: string): View {
        this.template = new Template(filePath);
        return this;
    }

    /**
     * @inheritdoc
     */
    render(): View {
        this.trigger('begin:render');
        if (this.template)
            this.html = this.template.compile();
        else
            super.render();
        this.each(view => this.$childContainer.append(view.render().$el));
        this.trigger('done:render');
        return this;
    }

    /**
     * Adds the given view instance to this view as a child.
     * If the view is already a subview of this view nothing will happen.
     * @param {View} view
     * @param {boolean} render
     * @chainable
     */
    add<T extends View>(view: T, render: boolean = true): View {
        // Check if the view is already a subview
        if (view._parent == this) return this;
        view._parent = this;
        this.views.push(view);
        if (render)
            this.render();
        this.trigger('add', view);
        view.trigger('addedTo', this);
        return this;
    }

    /**
     * Same as View#add, but will always re-append the view, no matter if the
     * given view is already a subview of this one.
     * @param  {View} view
     * @chainable
     */
    append<T extends View>(view: T): View {
        if (view._parent == this) {
            var index = this.views.indexOf(view);
            if (index >= 0) this.views.splice(index, 1);
            view._parent = null;
        }
        this.add(view);
        this.trigger('append', view);
        view.trigger('appendedTo', this);
        return this;
    }

    /**
     * Same as View#append but the other way around.
     * @param  {View} view
     * @chainable
     */
    prepend <T extends View>(view: T): View {
        if (view._parent == this) {
            var index = this.views.indexOf(view);
            if (index >= 0) this.views.splice(index, 1);
        }
        this.views.unshift(view);
        this.render();
        this.trigger('prepend', view);
        view.trigger('prependTo', this);
        return this;
    }

    /**
     * Removes the given child view from this view.
     * `remove` event will be triggered if the DOM element got removed.
     * `detach` event will be triggered if the DOM element still exists.
     * `delete` event will be triggered in any case.
     * @param  {View} view
     * @param  {boolean} remove Option for removing the DOM element.
     * @chainable
     */
    delete(view: View, remove: boolean = false): View {
        var index = this.views.indexOf(view);
        if (index >= 0)  {
            this.views.splice(index, 1);
            if (remove) {
                view.remove();
                this.trigger('remove', view);
                view.trigger('removedFrom', this);
            }
            else {
                view.$el.detach();
                view.stopListening();
                this.trigger('detach', view);
                view.trigger('detachedFrom', this);
            }
            view._parent = null;
            this.trigger('delete', view);
            view.trigger('deletedFrom', this);
        }
        return this;
    }

    /**
     * @returns {string} The raw html of this view.
     */
    get html(): string {
        return this.$el.html();
    }

    /**
     * Sets the html content of this view.
     * The `change:html` event is triggered after this.
     * @param  {string} html The new html of this view.
     */
    set html(html: string) {
        var old = this.html;
        this.$el.html(html);
        this.trigger('change:html', old, html);
    }

    /**
     * Hides this view.
     * @chainable
     */
    hide(): View {
        this.$el.hide();
        this.trigger('hidden')
        return this;
    }

    /**
     * Shows this view.
     * Works only, if this view was already rendered.
     * @chainable
     */
    show(): View {
        this.$el.show();
        this.trigger('shown');
        return this;
    }

    /**
     * Finds a subview in this view.
     * @param  {Function} cb
     * @returns {View} `null` if no view has been found.
     */
    find(cb: Function) {
        return _.find(this.views, cb);
    }

    /**
     * forEach wrapper for the subviews of this view.
     * @param  {Function} cb
     * @returns {void}
     */
    each(cb: Function) {
        this.views.forEach((<any>cb));
    }

    /**
     * Removes all child views and re-renders this view.
     * @chainable
     */
    empty(): View {
        this.subviews().forEach(view => this.delete(view));
        this.$el.empty();
        this.render();
        this.trigger('emptied');
        return this;
    }

    /** @returns {View[]} Copy of all subviews. */
    subviews(cb?: Function): View[] {
        if (cb)
            return <View[]>_.filter(<any>this.views, <any>cb);
        else
            return this.views.slice();
    }

    /**
     * Sames as View#$ but instead of returning the jQuery instance, the view
     * is returned.
     * @param  {string} selector
     * @param  {boolean = true} subviews Whether to traverse subviews, too.
     * @returns {View[]}
     */
    select(selector: string, subviews: boolean = true): View[] {
        let elmts = this.$(selector);
        let views = this.subviews(view => _.find(elmts, el => view.el == el ));
        if (subviews)
            this.each(view => views = views.concat(view.select(selector)) );
        return views;
    }

    /**
     * Updates the internal css hash.
     * @param  {string | Object} style Style string or hash supported by jQuery.
     * @returns {void}
     */
    protected updateCSS(style: string | Object) {
        let changed = {};
        // Collect the changed attributes
        let fn = (varName, value) => changed[varName] = value;
        this._css.once('change:*', fn);
        // Update the css instance and the DOM element
        this._css.set(style);
        this.$el.css(this._css.get());
        // If a change happened, trigger the change:css event
        if (Object.getOwnPropertyNames(changed).length) {
            this.attributes.style = this.$el.attr('style');
            this.trigger('change:css', changed);
        }
        // In case the change:* event was not triggered
        this._css.off('change:*', fn);
    }

    /**
     * Sets the css of this view.
     * The `change:css` event on this view is triggered with the added style
     * hash object as an argument.
     * The `change:css:*` event is triggered if a property changes. The property
     * name, the new and previous values are passed as arguments to the handler.
     * In addition the `change:css:${propertyName}` event is triggered if the
     * respective css property changes it's value. The new and previous value
     * are passed as arguments to the handler.
     * Change events are only triggered if the style changed.
     * @param  {string | Object} css Style string or hash supported by jQuery.
     * @returns {void}
     */
    set css(css: string | Object) {
        this.updateCSS(css);
    }

    /** @returns {Object} The current css hash. */
    get css() {
        return this._css.get();
    }

    /** Alias for {@see View#css} */
    set style(style: string | Object) {
        this.updateCSS(style);
    }

    /** Alias for {@see View#css} */
    get style() {
        return this._css.get();
    }

    /**
     * Clones this view and returns the new instance.
     * @returns {this} The new view instance.
     */
    clone(): this {
        let proto = Object.getPrototypeOf(this);
        let clazz = function(options: any) { proto.constructor.apply(this, arguments); };
        clazz.prototype = proto;
        let view = new clazz({
            className: this.className,
            tagName: this.tagName,
            attributes: this.attributes
        });
        let $el = this.$el.clone();
        view.setElement($el);
        return view;
    }

    /**
     * @inheritdoc
     * Triggers the `change:element` with the new and the old jQuery instances
     * as arguments.
     */
    setElement(element: JQuery): View {
        let $old = this.$el;
        super.setElement(element);
        this.trigger('change:element', this.$el, $old);
        return this;
    }
}
