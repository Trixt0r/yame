import { View } from '../../core/view/abstract';
import { Button, Group } from '../../core/view/button';
import { Icon } from '../../core/view/icon';
import { Tool } from '../interaction/tool';

import * as EDITOR from '../globals';

import * as _ from 'underscore';

export class Tools extends View {

    private _tools: Tool[];
    private _currentTool: Tool;
    private segment: View;
    private buttons: Group;
    private _hasKeyboardFocus: boolean;

    constructor() {
        super({ id: 'tools' });
        this._tools = [];

        this.buttons = new Group({ className: 'ui vertical icon menu' });
        this.add(this.buttons);

        this._hasKeyboardFocus = false;

        $(document).click(e => this._hasKeyboardFocus = EDITOR.hasRendererFocus() && !_.contains(['INPUT', 'TEXTAREA'],  document.activeElement.tagName) );
    }

    /**
     * Adds the given tool to this tools view.
     * @param  {Tool}   tool
     * @chainable
     */
    addTool(tool: Tool) {
        let button = tool.getButton();
        this.buttons.add(button);
        if (!this._tools.length) {
            this.buttons.activate(button);
            this._currentTool = tool;
        }
        button.on('click', () => this.currentTool = tool);
        tool.trigger('added', this);
        this._tools.push(tool);
        return this;
    }

    /**
     * Removes the given tool from the tools set.
     * @param  {Tool}   tool
     * @chainable
     */
    removeTool(tool: Tool) {
        let idx = this._tools.indexOf(tool);
        if (idx >= 0) {
            this._tools.splice(idx, 1);
            tool.trigger('removed', this);
        }
        return this;
    }

    /**
     * Sets the current tool.
     * Triggers the `unselected` event on the previous tool.
     * Triggers the `selected` event on the selected tool.
     * Triggers the `change:tool` event on this view.
     * @param  {Tool}   tool
     * @returns {void}
     */
    set currentTool(tool: Tool) {
        if (this._currentTool != tool) {
            let prev = this._currentTool;
            prev.trigger('unselected', this);
            this._currentTool = tool;
            tool.trigger('selected', this);
            this.trigger('change:tool', this._currentTool, prev);
        }
    }

    /** @returns {Tool} The currently selected tool. */
    get currentTool(): Tool {
        return this._currentTool;
    }

    /**
     * @param  {Tool}   tool
     * @returns {boolean} Whether the given tool is active or not.
     */
    isActive(tool: Tool): boolean {
        return this._currentTool == tool;
    }

    /** @returns {Tool[]} Copy of the current tools array. */
    get tools(): Tool[] {
        return this._tools.slice();
    }

    /**
     * @readonly
     * @type {boolean}
     */
    get hasKeyboardFocus(): boolean {
        return this._hasKeyboardFocus;
    }

    /**
     *
     * @readonly
     * @type {boolean}
     * @memberOf Tools
     */
    get hasFocus(): boolean {
        return EDITOR.hasRendererFocus();
    }
}
