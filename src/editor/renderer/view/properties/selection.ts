import * as _ from 'underscore';

import Entity from '../../../../core/common/entity';
import View from '../../../../core/renderer/view/abstract';
import ColorPicker from '../../../../core/renderer/view/colorPicker';
import LabeledInput from '../../../../core/renderer/view/composition/labeledInput';
import Point from './point';
import Value from './value';
import EventBus from '../../../../core/common/eventbus';
import Container from '../../interaction/transformation/container';


let Pubsub: Backbone.Events = require('backbone').Events;

export class Selection extends View {

    constructor(private container: Container) {
        super();

        let position = new Point( { title: 'Position', instance: container.position } );
        let scale = new Point( { title: 'Scale', instance: container.scale } );
        let rotation = new Value( {title: 'Rotation', instance: container, attribute: 'rotation'});
        let color = new ColorPicker({
            title: 'Tint and alpha',
            colorPicker: {
                color: '#fff',
                showAlpha: true,
                showInput: true,
                preferredFormat: 'hex',
                showPalette: true,
                showSelectionPalette: true,
                localStorageKey: "spectrum",
                palette: [
                    ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
                    "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
                    ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
                    "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
                    ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
                    "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
                    "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
                    "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
                    "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
                    "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
                    "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
                    "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
                    "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
                    "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
                ],
            }
        });

        position.x.mapFrom = val => Math.round(val);
        position.y.mapFrom = val => Math.round(val);

        scale.x.mapFrom = val => Math.round(val * 100);
        scale.y.mapFrom = val => Math.round(val * 100);
        scale.x.mapTo = val => val / 100;
        scale.y.mapTo = val => val / 100;

        rotation.value.mapFrom = val => (360 + Math.round((<any>Math).degrees(val))) % 360;
        rotation.value.mapTo = val => (<any>Math).radians(val);

        this.add(position).add(scale).add(rotation);

        let ctx = {};

        Pubsub.on('selection:select', (children: Entity[]) => {
            color.off('hide move', null, this);

            let applyColor = () => {
                color.on('hide move', color => {
                    children.forEach((child: any) => {
                        child = <PIXI.Sprite>child;
                        child.alpha = color.getAlpha();
                        child.tint = parseInt(color.toHex(), 16);
                    });
                }, this);
            };

            if (children.length === 1) {
                scale.x.input.enable();
                scale.y.input.enable();
                let child = <PIXI.Sprite><any>children[0];
                if ( typeof child.tint == 'number' ) {
                    this.add(color);
                    color.color = child.tint.toString(16);
                    color.alpha = child.alpha;
                    applyColor();
                } else this.delete(color, false);
            }
            else {
                let type = children[0].type;
                let found = _.find(children, child => child.type != type);
                if (found)
                    this.delete(color, false);
                else {
                    this.add(color);
                    color.color = 'FFFFFF';
                    color.alpha = 1;
                    applyColor();
                }
                scale.x.input.disable();
                scale.y.input.disable();
            }

        });
    }
}

export default Selection;