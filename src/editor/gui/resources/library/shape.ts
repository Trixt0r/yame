import { Library } from '../library';
import { View } from '../../../../core/view/abstract';
import { Accordion, Group } from '../../../../core/view/accordion';
import { ShapeFactory } from '../../../../core/graphics/shapeFactory';
import { List }  from '../../../../core/view/list';
import Resources = require('../../../resources');
import Selection = require('../../../interaction/selection');

var randomstring = require("randomstring");
var Pubsub = require('backbone').Events;

export class Shape {

    shapes: Group;
    images: View;

    constructor(private library: Library) {
        Resources.setFactoryForType('Shape', new ShapeFactory());
        this.shapes = library.accordion.create('Shapes');

        this.images = new List({
            className: 'ui middle aligned selection animated list',
        });
        this.shapes.content.add(this.images);

        var img = new View({
            el: '<svg style="width: 20px; height: 20px; display: inline-block;"><rect style="fill:rgb(255,255,255);stroke-width:3;stroke:rgb(0,0,0); width: 20px; height: 20px" /></svg>'
        });
        this.images.add(img);
        img.$el.removeClass().addClass('ui avatar image sprite');
        var name = new View({ className: 'content' });
        name.$el.css('display', 'inline-block')
        name.$el.html('<div class="header">Rectangle</div>');
        img.parent.add(name);
        img.parent.$el.css('max-height', '45px');
        img.parent.$el.attr('draggable', 'true');
        img.parent.$el.bind('dragstart', (e: any) => {
            Resources.setPayload(e, 'object:shape', 'rectangle');
            e.originalEvent.dataTransfer.setData('type', 'Shape');
        });



        img = new View({
            el: '<svg style="width: 20px; height: 20px; display: inline-block;"><circle cx="10" cy="10" r="9" stroke="black" stroke-width="2" fill="white" /></svg>'
        });
        this.images.add(img);
        img.$el.removeClass().addClass('ui avatar image sprite');
        var name = new View({ className: 'content' });
        name.$el.css('display', 'inline-block')
        name.$el.html('<div class="header">Circle</div>');
        img.parent.add(name);
        img.parent.$el.css('max-height', '45px');
        img.parent.$el.attr('draggable', 'true');
        img.parent.$el.bind('dragstart', (e: any) => {
            Resources.setPayload(e, 'object:shape', 'circle');
            e.originalEvent.dataTransfer.setData('type', 'Shape');
        });



        // img = new View({
        //     el: '<p></p>'
        // });
        // this.images.add(img);
        // img.$el.removeClass().addClass('ui avatar image sprite');
        // var name = new View({ className: 'content' });
        // name.$el.css('display', 'inline-block')
        // name.$el.html('<div class="header">Polygon</div>');
        // img.parent.add(name);
        // img.parent.$el.css('max-height', '45px');
        // img.parent.$el.attr('draggable', 'true');
        // img.parent.$el.bind('dragstart', (e: any) => {
        //     Resources.setPayload(e, 'object:shape', 'polygon');
        //     e.originalEvent.dataTransfer.setData('type', 'Shape');
        // });
    }
}
