import {Bindable} from '../bindable';
import {Input} from '../input';
import {Label} from '../label';

import _ = require('underscore');

export class LabeledInput extends Bindable {

    protected _input: Input;
    protected _label: Label;

    constructor (options: any = {}) {
        super(_.extend( { className: 'ui fluid labeled input' }, options));
        this.twoWayEvents = ['keyup input', 'keydown input', 'change input', 'mousewheel input'];
        this._label = new Label(options.label);
        this._input = new Input(options.input);
        this.add(this._label);
        this.add(this._input);
    }

    /** @returns {Input} The input view. */
    get input(): Input {
        return this._input;
    }

    /** @returns {Label} The label view. */
    get label(): Label {
        return this._label;
    }

    /** @inheritdoc */
    set val(val: any) {
        this.input.value = val;
    }

    /** @inheritdoc */
    get val(): any {
        return this.input.value;
    }
}
