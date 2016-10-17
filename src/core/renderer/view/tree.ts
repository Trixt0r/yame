import * as _ from 'underscore';
import * as Promise from 'bluebird';

import Dropdown from './dropdown';
import View from './abstract';

require('jstree');

export class Tree extends View {

    private dropdown: Dropdown;
    private dropdownTemplates: { [type: string] : string  };
    private lastClickedNode: any;
    private $lastClickedNode: any;

    constructor(options: any = { }) {
        super(options);

        this.dropdownTemplates = { };
        this.$el.jstree(_.extend({
            core : {
                animation : 100,
                check_callback : true,
                themes : {  },
                data : [],
                multiple: false
            },
            dnd: {
                use_html5: true
            },
            plugins : [ 'dnd', 'types' ]
        }, options.jstree));

        $(document).on('dnd_start.vakata', (e: any) => {
             if (!$.contains( this.el, e.delegateTarget.activeElement) ) return;
             this.trigger('rename:stop');
        });
    }

    /**
     * Sets a context menu for the given node type.
     * @param {string} type The node type. Comma seperated types are supported.
     * @param {string} templatePath Path to the template.
     * @returns {Dropdown}
     */
    setContextMenu(type: string, templatePath: string): Dropdown {
        if (!this.dropdown) {
            this.dropdown = new Dropdown();
            this.dropdown.on('dropdown:change', (value, text, $el: JQuery) => {
                if (!$el) return;
                if (value)
                    this.trigger(`dropdown:change:${this.lastClickedNode.type}:${value}`, $el, this.lastClickedNode, this.$lastClickedNode);
                this.trigger(`dropdown:change:${this.lastClickedNode.type}`, value, $el, this.lastClickedNode, this.$lastClickedNode);
                this.trigger('dropdown:change', value, $el, this.lastClickedNode, this.$lastClickedNode);
            });
            $('body').append(this.dropdown.$el);
        }
        this.dropdownTemplates[type] = templatePath;
        return this.dropdown;
    }

    /**
     * Shows a context menu for the given node object.
     *
     * @param {JQueryEventObject} e
     * @param {*} obj
     * @returns
     *
     * @memberOf Tree
     */
    showContextMenu(e: JQueryEventObject, obj: any) {
        this.lastClickedNode = this.$el.jstree(true).get_node(obj);
        this.$lastClickedNode = this.$el.jstree(true).get_node(obj, true);
        let found = _.find(this.dropdownTemplates, (path, type) => type.split(',').indexOf(this.lastClickedNode.type) >= 0);
        if (found) {
            this.dropdown.$el.removeClass('visible active');
            this.dropdown.setTemplate(found).render();
            this.trigger('dropdown:show', e, this.dropdown, this.lastClickedNode,  this.$lastClickedNode);
            this.trigger(`dropdown:show:${this.lastClickedNode.type}`, e, this.dropdown, this.lastClickedNode,  this.$lastClickedNode);
            let $menu = this.dropdown.$('.menu').first();
            this.dropdown.$el.css({
                position: 'absolute',
                left: Math.max(0, Math.min(e.clientX, window.innerWidth - $menu.outerWidth(true))),
                top: Math.max(0, Math.min(e.clientY, window.innerHeight - $menu.outerHeight(true)))
            });
            // Make sure sub menus get displayed in the view port
            setTimeout(() => {
                let bounds = $menu[0].getBoundingClientRect();
                $menu.find('.item .menu').each(function() {
                    let $el = $(this);
                    if (bounds.right + $el.outerWidth() > window.innerWidth)
                        $el.addClass('left');
                });
            });

            this.dropdown.show();
        }
        return found;
    }

    /** @inheritdoc */
    events(): Backbone.EventsHash {
        return {
            'mouseup .jstree-anchor': e => {
                if (e.which === 3) {
                    let $target = $(e.target);
                    if (!this.showContextMenu(e, $target))
                        this.trigger('rightclick', e, this.lastClickedNode,  this.$lastClickedNode);
                }
            }
        };
    }

    /**
     * Shows an input field for renaming the given node.
     * As soon as the input field loses focus or the user presses enter, the
     * promise resolves the name set in the input field. The input field gets
     * removed automatically from the DOM.
     *
     * @param {*} obj
     * @param {boolean} [renameNode=true] Whether to rename the node or not.
     * @returns {Promise<string>}
     *
     * @memberOf Tree
     */
    rename(obj: any, renameNode: boolean = true): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let node = this.$el.jstree(true).get_node(obj);
            let $el = this.$el.jstree(true).get_node(obj, true);

            let $input = $('<input></input>');
            let prevVal = node.text;
            $input.val(prevVal);
            $input.click(e => {
                e.preventDefault();
                e.stopPropagation();
            });

            let finish =() => {
                let val = $input.val();

                if (val != prevVal && renameNode) {
                    this.$el.jstree(true).rename_node(obj, val);
                    resolve($input.val());
                }
                $input.remove();
                this.off('rename:stop');
            };

            $input.on('blur change focusout', finish);
            this.on('rename:stop', finish);

            $el.find('a').first().append($input);
            setTimeout(() => $input.focus(), 0);
        });
    }


}

export default Tree;