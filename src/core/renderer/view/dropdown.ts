import * as _ from 'underscore';

import View from './abstract';

/**
 * View for displaying dropdowns.
 * @class Dropdown
 * @extends {View}
 */
export class Dropdown extends View {

    constructor(options: any = {}) {
        super(_.extend({
            className: 'ui dropdown'
        }, options));

        $('body').click(() => this.hide());

        let events = {
            onChange: (value, text, $choice) => this.trigger('dropdown:change', value, text, $choice),
            onAdd: (addedValue, addedText, $addedChoice) => this.trigger('dropdown:add', addedValue, addedText, $addedChoice),
            onRemove: (removedValue, removedText, $removedChoice) => this.trigger('dropdown:remove', removedValue, removedText, $removedChoice),
            onLabelCreate: (value, text) => this.trigger('dropdown:labelCreate', value, text),
            onLabelRemove: (value) => this.trigger('dropdown:labelRemove', value),
            onLabelSelect: ($selectedLabels) => this.trigger('dropdown:labelSelect', $selectedLabels),
            onNoResults: (searchValue) => this.trigger('dropdown:noResults', searchValue),
            onShow: () => this.trigger('dropdown:show'),
            onHide: () => this.trigger('dropdown:hide'),
        };

        (<any>this.$el).dropdown(events);
        this.on('done:render', () => {
            (<any>this.$el).dropdown(events);
            this.clear();
        });
    }

    /** @inheritdoc */
    show(): View {
        (<any>this.$el).dropdown('show');
        return super.show();
    }

    /** @inheritdoc */
    hide(): View {
        (<any>this.$el).dropdown('hide');
        return super.hide();
    }

    /**
     * Clears this dropdown view.
     * @chainable
     */
    clear(): Dropdown {
        (<any>this.$el).dropdown('clear');
        return this;
    }
}

export default Dropdown;