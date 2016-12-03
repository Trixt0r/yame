import { LabeledInput } from '../composition/labeledInput';
import { Component } from './';
import { Number as No } from '../../../common/component/number';

import * as _ from 'underscore';

interface Options extends Backbone.ViewOptions<Backbone.Model> {
    component: No;
}

/**
 * View for displaying a number component.
 * This view gets automatically bound to the supplied component.
 * @class Number
 * @extends {LabeledInput}
 * @implements {Component<No>}
 */
export class Number extends LabeledInput implements Component<No> {

    component: No;

    constructor(options: Options) {
        super(_.extend({
            label: { text: options.component.name },
            input: {
                value: options.component.value,
                type: 'number'
            }
        }, options));
        this.component = options.component;
        this.eventDelimitter = '';

        // Make sure that the component has always a number as a value
        this.mapTo = (val) => parseFloat(val);
        this.bindTo(this.component, 'value', true);
    }
}