import { Component } from './';
import { Checkbox } from '../checkbox';
import { Boolean as Bool } from '../../../common/component/boolean';

import * as _ from 'underscore';

interface Options extends Backbone.ViewOptions<Backbone.Model> {
    component: Bool;
}

/**
 * View for displaying a boolean component.
 * This view gets automatically bound to the supplied component.
 * @class Boolean
 * @extends {Checkbox}
 * @implements {Component<Bool>}
 */
export class Boolean extends Checkbox implements Component<Bool> {

    component: Bool;

    constructor(options: Options) {
        super(_.extend({
            className: 'ui checkbox component',
            checked: options.component.value,
            text: options.component.name,
        }, options));
        this.eventDelimitter = '';
        this.component = options.component;
        this.bindTo(this.component, 'value', true);
        this.css = 'margin: 1rem 0;';
    }
}