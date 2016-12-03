import View from '../../../../core/renderer/view/abstract';
import LabeledInput from '../../../../core/renderer/view/composition/labeledInput';
import EventBus from '../../../../core/common/eventbus';

import _ = require('underscore');

export class Value extends View {

    private _value: LabeledInput;
    private _title: View;

    constructor(options: any = { title: '' }) {
        super(_.extend({
            title: 'Value',
            className: 'ui segment'
        }, options));

        let instance = options.instance;
        let attribute = options.attribute;
        let type = typeof instance[attribute] != 'number' ? 'text' : 'number'

        this._title = new View({ el: `<div class="ui tiny header">${options.title}</div>` });
        this._value = new LabeledInput({
            label: { text: attribute },
            input: { value: instance[attribute], type: type }
        });
        this._value.bindTo(instance, attribute, true);
        this.add(this._title).add(this._value);
    }


    /** @returns {LabeledInput} The input view for the value. */
    get value(): LabeledInput {
        return this._value;
    }

    /** @returns {View} The title view of this value input. */
    get title(): View {
        return this._title;
    }
}

export default Value;