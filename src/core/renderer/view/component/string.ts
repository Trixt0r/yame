import { LabeledInput } from '../composition/labeledInput';
import { Component } from './';
import { String as Str } from '../../../common/component/string';

import * as _ from 'underscore';

interface Options extends Backbone.ViewOptions<Backbone.Model> {
    component: Str;
}

/**
 * View for displaying a string component.
 * This view gets automatically bound to the supplied component.
 * @class String
 * @extends {LabeledInput}
 * @implements {Component<Str>}
 */
export class String extends LabeledInput implements Component<Str> {

    component: Str;

    constructor(options: Options) {
        super(_.extend({
            className: 'ui fluid labeled input component',
            label: { text: options.component.name },
            input: {
                value: options.component.value,
                type: 'text'
            }
        }, options));
        this.component = options.component;
        this.eventDelimitter = '';
        this.bindTo(this.component, 'value', true);
    }
}