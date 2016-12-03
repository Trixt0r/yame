import { Label } from './label';
import { Input } from './input';
import * as _ from 'underscore';

import Bindable from './bindable';

export class Checkbox extends Bindable {

    _input: Input;
    _label: Label;
    protected delegates = {
        onChange: () => this.$el.trigger('change'),
        onChecked: () => this.$el.trigger('checked'),
        onIndeterminate: () => this.$el.trigger('indeterminate'),
        onDeterminate: () => this.$el.trigger('determinate'),
        onUnchecked: () => this.$el.trigger('unchecked'),
        beforeChecked: () => this.$el.trigger('beforeChecked'),
        beforeIndeterminate: () => this.$el.trigger('beforeIndeterminate'),
        beforeDeterminate: () => this.$el.trigger('beforeDeterminate'),
        beforeUnchecked: () => this.$el.trigger('beforeUnchecked'),
        onEnable: () => this.$el.trigger('enable'),
        onDisable: () => this.$el.trigger('disabled'),
    };

    /** @inheritdoc */
    set val(val: boolean) {
        if (val)
            (<any>this.$el).checkbox('check');
        else
            (<any>this.$el).checkbox('uncheck');
    }

    /** @inheritdoc */
    get val(): boolean {
        return (<any>this.$el).checkbox('is checked');
    }

    constructor(options: any = { }) {
        super(_.extend({
            className: 'ui checkbox'
        }, options));
        this._input = new Input({
            type: 'checkbox'
        });
        if (options.checked === true)
            this._input.attributes.checked = '';
        this._label = new Label({
            className: '',
            text: options.text
        });
        this.add(this._input);
        this.add(this._label);
        this.twoWayEvents = ['change'];
        (<any>this.$el).checkbox(this.delegates);
        this.on('done:render', () => (<any>this.$el).checkbox(this.delegates));
    }

}

export default Checkbox;