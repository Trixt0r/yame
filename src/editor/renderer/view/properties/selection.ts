import { Bindable } from '../../../../core/renderer/view/bindable';
import { Accordion, Group, SubAccordion } from '../../../../core/renderer/view/accordion';
import { Component } from '../../../../core/common/component';
import { ComponentView } from '../../../../core/renderer/view/component';
import * as _ from 'underscore';

import Entity from '../../../../core/renderer/graphics/entity';
import View from '../../../../core/renderer/view/abstract';
import ColorPicker from '../../../../core/renderer/view/colorPicker';
import LabeledInput from '../../../../core/renderer/view/composition/labeledInput';
import EventBus from '../../../../core/common/eventbus';
import Container from '../../interaction/transformation/container';

import * as Select from '../../interaction/selection';

let Pubsub: Backbone.Events = require('backbone').Events;

export class Selection extends Accordion {

    private group: Group;

    constructor(private container: Container) {
        super({className: 'ui styled accordion'});

        this.group = this.create('Properties');
        this.group.active = true;
        this.group.setTitle('Properties');

        let mapFrom = val => Math.round(val * 100);
        let mapTo = val => val / 100;

        Pubsub.on('component:view', (view: View | ComponentView) => {
            let component: Component<any> = (<any>view).component;
            switch(component.name) {
                case 'scale':
                    // Disable scale for multiple selections
                    if (Select.getSelectionContainer().selection.length > 1)
                        (<ComponentView>view).disable();
                case 'skew':
                    (<ComponentView>view).content.subviews().forEach((v: Bindable) => {
                        v.mapFrom = mapFrom;
                        v.mapTo = mapTo;
                    });
                case 'position':
                     (<ComponentView>view).active = true;
                break;
                case 'rotation':
                    (<Bindable>view).mapFrom = val => (360 + Math.round((<any>Math).degrees(val))) % 360;
                    (<Bindable>view).mapTo = val => (<any>Math).radians(val);
                break;
            }
        });

        let ctx = {};

        Pubsub.on('selection:select', (children: Entity[]) => {
            this.group.content.empty();
            if (!children.length) this.disable();
            else this.group.enable();

            let accordion = new SubAccordion({noSemanticInit: false});

            let transformationView = <ComponentView>ComponentView.get(container.transformation);
            accordion.add(transformationView.title);
            accordion.add(transformationView.content);
            if (children.length == 1) {
                let filtered = _.filter(children[0].components.value, comp => {
                    if (comp instanceof Component)
                        return comp.name != 'transformation' &&
                                comp.name != 'z' &&
                                comp.name != 'id' &&
                                comp.name != 'layer';
                    else
                        return false;
                })
                _.each(filtered, component => {
                    if (component instanceof Component) {
                        let view = ComponentView.get(component);
                        if (view instanceof Group)
                            accordion.add([view.title, view.content]);
                        else
                            this.group.content.add(view);
                    }
                });
            }
        if (accordion.subviews().length)
            this.group.content.add(accordion);
        if (children.length) {
            this.group.active = true;
            transformationView.active = true;
        }
        });

        Pubsub.on('selection:unselect', this.disable, this);
        this.disable();
    }

    disable() {
        if (this.group.title.$el.hasClass('active'))
            this.group.title.$el.click();
        this.group.disable();
    }
}

export default Selection;