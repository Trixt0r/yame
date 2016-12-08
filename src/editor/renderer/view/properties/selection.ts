import { Component } from '../../../../core/common/component';
import { ComponentView } from '../../../../core/renderer/view/component';
import * as _ from 'underscore';

import Entity from '../../../../core/renderer/graphics/entity';
import View from '../../../../core/renderer/view/abstract';
import ColorPicker from '../../../../core/renderer/view/colorPicker';
import LabeledInput from '../../../../core/renderer/view/composition/labeledInput';
import EventBus from '../../../../core/common/eventbus';
import Container from '../../interaction/transformation/container';


let Pubsub: Backbone.Events = require('backbone').Events;

export class Selection extends View {

    constructor(private container: Container) {
        super();

        let mapFrom = val => Math.round(val * 100);
        let mapTo = val => val / 100;

        Pubsub.on('component:view', (view: View) => {
            let component: Component<any> = (<any>view).component;
            switch(component.name) {
                case 'scale':
                case 'skew':
                    view.subviews().forEach(v => {
                        (<any>v).mapFrom = mapFrom;
                        (<any>v).mapTo = mapTo;
                    });
                break;
                case 'rotation':
                    (<any>view).mapFrom = val => (360 + Math.round((<any>Math).degrees(val))) % 360;
                    (<any>view).mapTo = val => (<any>Math).radians(val);
                break;
            }
        });

        let ctx = {};

        Pubsub.on('selection:select', (children: Entity[]) => {
            this.empty();
            this.add(<any>ComponentView.get(container.transformation));
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
                _.each(filtered, component =>
                    {
                    if (component instanceof Component)
                        this.add(<any>ComponentView.get(component));
                    });
            }
            // color.off('hide move', null, this);

            // let applyColor = () => {
            //     color.on('hide move', color => {
            //         children.forEach((child: any) => {
            //             child = <PIXI.Sprite>child;
            //             child.alpha = color.getAlpha();
            //             child.tint = parseInt(color.toHex(), 16);
            //         });
            //     }, this);
            // };

            // if (children.length === 1) {
            //     scale.x.input.enable();
            //     scale.y.input.enable();
            //     let child = <PIXI.Sprite><any>children[0];
            //     if ( typeof child.tint == 'number' ) {
            //         this.add(color);
            //         color.color = child.tint.toString(16);
            //         color.alpha = child.alpha;
            //         applyColor();
            //     } else this.delete(color, false);
            // }
            // else {
            //     let type = children[0].type;
            //     let found = _.find(children, child => child.type != type);
            //     if (found)
            //         this.delete(color, false);
            //     else {
            //         this.add(color);
            //         color.color = 'FFFFFF';
            //         color.alpha = 1;
            //         applyColor();
            //     }
            //     scale.x.input.disable();
            //     scale.y.input.disable();
            // }

        });
    }
}

export default Selection;