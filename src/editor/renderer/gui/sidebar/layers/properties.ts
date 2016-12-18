import { Accordion, Group } from '../../../../../core/renderer/view/accordion';
import { Container } from '../../../interaction/transformation/container';
import View from '../../../../../core/renderer/view/abstract';
import LabeledInput from '../../../../../core/renderer/view/composition/labeledInput';
import EventBus from '../../../../../core/common/eventbus';
import Selection from '../../../view/properties/selection';

let Pubsub: Backbone.Events = require('backbone').Events;

/**
 * View for displaying the properties of the current selection.
 */
export class Properties extends Accordion {

    _properties: Selection;
    private group: Group;

    constructor(private editable: Container) {
        super({ className: 'ui styled accordion' });
        this._properties = new Selection(editable);

        this.group = this.create('Properties');
        this.group.active = true;
        this.group.setTitle('Properties');
        this.group.setContent(this._properties);

        Pubsub.on('selection:select', children => {
            if (!children.length) this.disable();
            else this.group.enable();
        });
        Pubsub.on('selection:unselect', () => this.disable());
        this.disable();

        // this.css = 'overflow-y: auto;';
        // Pubsub.trigger('layers:properties:init', this);
    }

    get properties(): Selection {
        return this._properties;
    }

    disable() {
        if (this.group.title.$el.hasClass('active'))
            this.group.title.$el.click();
        this.group.disable();
    }
}

export default Properties;