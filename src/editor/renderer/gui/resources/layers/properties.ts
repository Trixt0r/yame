import View from '../../../../../core/renderer/view/abstract';
import LabeledInput from '../../../../../core/renderer/view/composition/labeledInput';
import EventBus from '../../../../../core/common/eventbus';
import Selection from '../../../view/properties/selection';

let Pubsub: Backbone.Events = require('backbone').Events;

/**
 * View for displaying the properties of the current selection.
 */
export class Properties extends View {

    title: View;
    _properties: Selection;
    hiding: Boolean;
    showing: Boolean;

    constructor(private editable: EventBus) {
        super({ className: 'ui segment properties' });
        this.hiding = false;
        this.showing = false;
        this.title = new View({ el: '<div class="ui small header">Properties</div>' });
        this._properties = new Selection(<any>editable);

        this.$el.bind('transitionend', ev => {
            if (this.$el.hasClass('hidden')) {
                this.$el.hide();
                this.trigger('hidden');
            }
            else
                this.trigger('shown');
        });

        Pubsub.on('selection:select', children => {
            if (children.length) this.show();
            else this.hide();
        });
        Pubsub.on('selection:unselect', () => this.hide());

        this.add(this.title);
        this.add(this._properties);
        this.css = 'overflow-y: auto;';
        Pubsub.trigger('layers:properties:init', this);
    }

    /** @inheritdoc */
    show(): View {
        $(document.activeElement).blur();
        if (this.$el.hasClass('hidden')) {
            this.$el.show();
            this.$el.removeClass('hidden');
        }
        return this;
    }

    /** @inheritdoc */
    hide(): View {
        if (!this.$el.hasClass('hidden'))
            this.$el.addClass('hidden');
        return this;
    }

    get properties(): Selection {
        return this._properties;
    }
}

export default Properties;