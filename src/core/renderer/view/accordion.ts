import View from './abstract';
import {Icon} from './icon';

import path = require('path');
import _ = require('underscore');

/**
 * A title view for an accordion view.
 */
@View.DOM('Accordion.Title')
class Title extends View {

    private _icon: Icon;
    private _text: View;

    constructor(options: any = {}) {
        super(_.extend({ className: 'title' }, options));
        this._icon = new Icon({ iconName: 'dropdown' });
        this._text = new View({ el: '<span>' + options.text + '</span>'});
        super.add(this._icon);
        super.add(this._text);
    }

    /**
     * @returns {Views.Icon} The icon view of this title.
     */
    get icon(): Icon {
        return this.icon;
    }

    /**
     * @returns {View} The text view of this title.
     */
    get text(): View {
        return this._text;
    }
}

/**
 * A content view for an accordion view.
 */
@View.DOM('Accordion.Content')
class Content extends View {
    constructor() {
        super({ className: 'content' });
    }

    /**
     * Delets all previously set subviews and replaces them with the given one.
     * @param  {View} content
     * @chainable
     */
    set(content: View): View {
        this.views = [];
        this.add(content);
        return this;
    }
}

/**
 * A class for grouping up title and content of an accordion.
 */
export class Group {

    private _title: Title;
    private _content: Content;


    /**
     * @param  {any} options If options.parent is not set, the panel will be attached to the body.
     */
    constructor(private _parent: Accordion) {
        this._title = new Title();
        this._content = new Content();
    }

    /**
     * @returns {Body} The body view of this panel.
     */
    get content(): Content {
        return this._content;
    }

    /**
     * @returns {Heading} The heading view of this panel.
     */
    get title(): Title {
        return this._title;
    }

    /**
     * Sets the text for the title view.
     * @param  {string} title
     * @chainable
     */
    setTitle(title: string): Group {
        this._title.text.$el.text(title);
        return this;
    }

    /**
     * Shortcut for {@link Content#set}.
     * @param  {View}  view
     * @chainable
     */
    setContent(view: View): Group {
        this._content.set(view);
        return this;
    }

    /**
     * Adds a view to the content view.
     * @param  {View}  view
     * @chainable
     */
    addContent(view: View): Group {
        this._content.add(view);
        return this;
    }

    /**
     * Activates or deactivaes this group of title and content views.
     * @param  {boolean} active
     * @returns {void}
     */
    set active(active: boolean) {
        if (active) {
            this._parent.collapseAll();
            if (!this._title.$el.hasClass('active'))
                this._title.$el.addClass('active');
            if (!this._content.$el.hasClass('active'))
                this._content.$el.addClass('active');
        } else {
            this._title.$el.removeClass('active');
            this._content.$el.removeClass('active');
        }
    }

    /**
     * Enables this group.
     * @chainable
     */
    enable() {
        this._title.$el.removeClass('disabled');
        return this;
    }

    /**
     * Disables this group
     * @chainable
     */
    disable() {
        this._title.$el.addClass('disabled');
        return this;
    }
}

/**
 * A group of accordion panels, i.e. an actual accordion.
 */
@View.DOM('Accordion')
export class Accordion extends View {

    private _groups: Group[];

    constructor(options: any = {}) {
        super(_.extend({
            className: 'ui accordion',
        }, options));
        this._groups = [];

        if (!options.noSemanticInit)
            (<any>this.$el).accordion({
                exclusive: false,
                onOpening: () => this.trigger('opening'),
                onOpen: () => this.trigger('opening'),
                onClosing: () => this.trigger('closing'),
                onClose: () => this.trigger('close'),
                onChange: () => this.trigger('change'),
                'close nested': false
            });
    }

    /**
     * Adds a new title and content in this accordion.
     * The `create:group` event gets triggered.
     * @returns {Group} The group containing the added views.
     */
    create(title?: string, content?: View): Group {
        var group = new Group(this);
        if (title) group.setTitle(title);
        if (content) group.setContent(content);
        this._groups.push(group);
        this.add(group.title).add(group.content);
        this.trigger('create:group', group);
        return group;
    }

    /**
     * Deletes the given group if it is part of this accordion.
     * The `delete:group` event is triggered if the group got deleted.
     * @param  {Group}     group
     * @chainable
     */
    removeGroup(group: Group): Accordion {
        let idx = this._groups.indexOf(group);
        if (idx >= 0) {
            this.delete(group.title, true).delete(group.content, true);
            this.trigger('delete:group', group);
        }
        return this;
    }

    /**
     * @returns {Group[]} The list of groups.
     */
    get groups(): Group[] {
        return this._groups;
    }

    /**
     * Collapses all open panels.
     * @chainable
     */
    collapseAll() {
        this._groups.forEach((group: Group) => group.active = false);
        return this;
    }
}

/**
 * An accordion which can be appended to any other accordion.
 */
export class SubAccordion extends Accordion {
    constructor(options: any = {}) {
        super(_.extend({
            className: 'accordion',
            noSemanticInit: true
        }, options));
    }
}

export default Accordion;