import { View } from './abstract';
import {Component as CompModel} from '../../common/component';

import { Number } from './component/number';
import { String } from './component/string';
import { Boolean } from './component/boolean';

import * as _ from 'underscore';

export abstract class Component<T extends CompModel<any>> {
    component: T
}

interface Options extends Backbone.ViewOptions<Backbone.Model> {
    component: CompModel<any>;
}

export class ComponentView extends View implements Component<CompModel<any>> {

    component: CompModel<any>;
    title: View;

    private constructor(options: Options) {
        super(_.extend({
            className: 'ui segment'
        }, options));
        this.component = options.component;
        this.title = new View({
            el: `<div class="ui tiny header">${this.component.name}</div>`
        });
        this.add(this.title);
    }

    private static definitions: {[type: string]: typeof Component} = {};

    static register(type: string, view: typeof Component) {
        ComponentView.definitions[type] = view;
    }

    static get<T extends CompModel<any>>(component: T): Component<T> {
        let type = component.type;
        let def = <any>ComponentView.definitions[type];
        let re: Component<T>;
        if (!def) {
            re = <any>new ComponentView({
                component: component
            });
            if (typeof component.value == 'object')
                _.each(component.value, val => {
                    if (val instanceof CompModel)
                        (<any>re).add(ComponentView.get(val));
                });
            else
                throw `View not defined for type '${component.type}'`;
        } else
            re = new def({
                component: component
            });
        return re;
    }
}

ComponentView.register('string', <any>String);
ComponentView.register('number', <any>Number);
ComponentView.register('boolean', <any>Boolean);