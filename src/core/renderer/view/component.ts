import { Point } from './component/point';
import { Accordion, Group, SubAccordion } from './accordion';
import { ColorPicker } from './colorPicker';
import { View } from './abstract';
import { Component as CompModel } from '../../common/component';

import { Number } from './component/number';
import { String } from './component/string';
import { Boolean } from './component/boolean';
import { File } from './component/file';

import * as _ from 'underscore';

let Pubsub = require('backbone').Events;

export abstract class Component<T extends CompModel<any>> {
    component: T
}

export class ComponentView extends Group implements Component<CompModel<any>> {

    component: CompModel<any>;

    private static definitions: { [type: string]: typeof Component } = {};

    static register(type: string, view: typeof Component) {
        ComponentView.definitions[type] = view;
    }

    static get<T extends CompModel<any>>(component: T, parent: Accordion = new Accordion()): View | ComponentView {
        let type = component.type;
        let def = <any>ComponentView.definitions[type];
        let re: View | ComponentView;
        if (!def) {
            re = new ComponentView();
            re.component = component;
            re.title.text.$el.text(component.name);
        } else
            re = new def({ parent: parent, component: component });


        if (re instanceof Group) {
            if (typeof component.value == 'object') {
                let accordion = new SubAccordion({className: 'accordion properties', noSemanticInit: false});
                _.each(component.value, val => {
                    if (val instanceof CompModel) {
                        let view = ComponentView.get(val);
                        if (view instanceof View)
                            (<ComponentView>re).content.add(view);
                        else
                            accordion.add(view.title).add(view.content);
                    }
                });
                if (accordion.subviews().length)
                    re.content.prepend(accordion);
            }
            else
                throw `View not defined for type '${component.type}'`;
        }
        Pubsub.trigger('component:view', re);
        return re;
    }
}

// Primitive component view definitions
ComponentView.register('string', <any>String);
ComponentView.register('number', <any>Number);
ComponentView.register('boolean', <any>Boolean);
ComponentView.register('point', <any>Point);
ComponentView.register('color', <any>ColorPicker);
ComponentView.register('file', <any>File);