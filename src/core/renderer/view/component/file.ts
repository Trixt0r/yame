import { LabeledInput } from '../composition/labeledInput';
import { Component } from './';
import { String as Str } from '../../../common/component/string';

import * as _ from 'underscore';

import {ipcRenderer} from 'electron';

interface Options extends Backbone.ViewOptions<Backbone.Model> {
    component: Str;
}

/**
 * View for displaying a file component.
 * This view gets automatically bound to the supplied component.
 * @class File
 * @extends {LabeledInput}
 * @implements {Component<Str>}
 */
export class File extends LabeledInput implements Component<Str> {

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
        this.label.$el.addClass('ui button');
        this.label.html = '<i class="ui icon file image outline"></i>';
        this.label.$('i').css('margin', 0 );
        this.component = options.component;
        this.eventDelimitter = '';
        this.bindTo(this.component, 'value', true);

        this.label.$el.on('click', () => {
            let id = _.uniqueId('opendir');
            ipcRenderer.send('showOpenDialog', { properties: ['openFile']}, id );
            ipcRenderer.on(`showOpenDialog:${id}`, (event, files: string[]) => {
                if (files)
                    this.component.value = files[0];
            });
        });
    }
}