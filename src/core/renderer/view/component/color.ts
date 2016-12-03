import { ColorPicker } from '../colorPicker';
import { Component } from './';
import { Color as Col } from '../../../common/component/color';

import * as _ from 'underscore';

interface Options extends Backbone.ViewOptions<Backbone.Model> {
    component: Col;
}

/**
 * View for displaying a color component.
 * This view gets automatically bound to the supplied component.
 * @class Color
 * @extends {LabeledInput}
 * @implements {Component<Str>}
 */
export class Color extends ColorPicker {

    // component: Col;

    // constructor(options?: Options) {
    //     super(_.extend({
    //         label: { text: options.component.name },
    //         input: {
    //             value: options.component.value,
    //             type: 'text'
    //         }
    //     }, options));
    //     this.component = options.component;
    //     this.eventDelimitter = '';
    //     this.bindTo(this.component, 'value', true);
    // }
}