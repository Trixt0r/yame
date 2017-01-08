import { Icon } from '../../../../core/renderer/view/icon';
import { Button } from '../../../../core/renderer/view/button';
import { Point } from '../../../../core/common/component/point';
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
        super({className: 'ui styled accordion properties'});

        this.group = this.create('Properties');
        this.group.active = true;
        this.group.setTitle('Properties');


        let button = new Button({className: 'mini circular ui right floated icon button'});
        button.add(new Icon({iconName: 'plus icon'}));
        button.css = 'margin-top: -5px';
        button.$('i').css('margin', 0);

        this.group.title.add(button);

        button.on('click', e => {
            // EDITOR.map.createLayer('layer-' + (layersCount++));
            e.stopPropagation();
        });

        let mapFrom = val => Math.round(val * 100);
        let mapTo = val => val / 100;

        Pubsub.on('component:view', (view: View | ComponentView) => {
            let component: Component<any> = (<any>view).component;
            switch(component.name) {
                case 'scale':
                case 'skew':
                    (<ComponentView>view).content.subviews().forEach((v: Bindable) => {
                        v.mapFrom = mapFrom;
                        v.mapTo = mapTo;
                    });
                case 'position':
                     (<ComponentView>view).active = true;
                     if (component.name == 'scale') {
                        // Disable scale for multiple selections
                        if (Select.getSelectionContainer().selection.length > 1) {
                            (<ComponentView>view).disable();
                            (<ComponentView>view).active = false;
                        }
                     }
                break;
                case 'rotation':
                    (<Bindable>view).mapFrom = val => (360 + Math.round((<any>Math).degrees(val))) % 360;
                    (<Bindable>view).mapTo = val => (<any>Math).radians(val);
                    (<LabeledInput>view).label.$el.html('<i class="ui icon circle notched"></i>');
                    component.off('change', null, this);
                    component.on('change', val => (<LabeledInput>view).label.$('i').css('transform', `rotate(${val}rad)` ), this);
                    (<LabeledInput>view).label.$('i').css('transform', `rotate(${component.value}rad)` );
                    (<LabeledInput>view).label.$('i').css('margin', 0 );
                break;
            }
        });

        let ctx = {};


        let accordion = new SubAccordion({className: 'accordion properties', noSemanticInit: false});
        this.group.content.add(accordion);

        Pubsub.on('selection:select', (children: Entity[]) => {
            this.group.content.empty();
            this.group.content.add(accordion);
            accordion.empty();

            let transformationView = <ComponentView>ComponentView.get(container.transformation);
            accordion.addGroup(transformationView);

            if (!children.length) this.disable();
            else this.group.enable();
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

        if (children.length) {
            if (!this.group.content.$el.hasClass('active'))
                this.group.active = true;
            transformationView.active = true;
        }
        });

        Pubsub.on('selection:unselect', this.disable, this);
        this.disable();
    }

    disable() {
        this.group.active = false;
        this.group.disable();
    }
}

export default Selection;