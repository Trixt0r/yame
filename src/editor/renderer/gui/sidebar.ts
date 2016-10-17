import EDITOR from '../globals';

import * as Backbone from 'backbone';
import * as _ from 'underscore';

import { ImageDropHandler } from '../../../core/renderer/drop/image';
import DropManager from '../../../core/renderer/drop/manager';
import Library from './sidebar/library';

import { Menu } from '../../../core/renderer/view/tabs';

import View from '../../../core/renderer/view/abstract';
import { Accordion, SubAccordion } from '../../../core/renderer/view/accordion';
import Map from '../../../core/renderer/scene/map';
import Layers from './resources/layers';

import SpriteResource from '../entity/implementation/sprite/resource';
import Resources from '../entity/resources';

var renderer = EDITOR.renderer;
var map = EDITOR.map;
var camera = EDITOR.camera;


const ipcRenderer = require('electron').ipcRenderer;
const Pubsub = require('backbone').Events;

export class Sidebar extends View {

    layers: Layers;
    lib: Library;
    public properties: View;

    constructor() {
        super({ id: 'resources' });

        let wrapper = new View({ className: 'wrapper' });
        this.add(wrapper);

        let resizer = new View({ className: 'hor-resizer' });
        this.add(resizer);
        let minWidth = 300, collapseThreshold = 100;
        let prevEvent = null, prevWidth = minWidth;
        let sizeFactor = prevWidth/window.innerWidth;
        resizer.$el.on('mousedown', e => {
            prevEvent = e; prevWidth = this.$el.outerWidth(true);
        });
        $('body').on('mouseup', () => prevEvent = null);
        $('body').on('mousemove', e => {
            if (prevEvent) {
                e.stopPropagation();
                e.preventDefault();
                let newWidth = prevWidth + prevEvent.clientX - e.clientX;
                if (newWidth < minWidth - collapseThreshold)
                    this.$el.css('width', '10px');
                else
                    this.$el.css('width', Math.min(window.innerWidth - ($('.zoom').first().outerWidth(true) + $('.zoom').first().position().left*2), Math.max(minWidth, newWidth)) + 'px');
            sizeFactor = this.$el.outerWidth(true)/window.innerWidth;
            }
        });

        $(window).on('resize', () => {
            let newWidth = this.$el.outerWidth(true);

            if (newWidth <= minWidth) return;

            newWidth = window.innerWidth * sizeFactor;
            this.$el.css('width', Math.min(window.innerWidth - ($('.zoom').first().outerWidth(true) + $('.zoom').first().position().left*2), Math.max(minWidth, newWidth)) + 'px');
        })

        var tabMenu = new Menu();
        wrapper.add(tabMenu);

        this.layers = new Layers(tabMenu);

        this.lib = new Library();

        let test = tabMenu.tab('Resources', this.lib);
        test.$el.append('Resources');


        var dir = -1;
        var rot = 90;

        this.$el.bind('transitionend', ev => {
            var $el = $(ev.target);
            if ($el.css('right') == '0px') this.trigger('opened');
            else this.trigger('closed');
        });

        this.$('.angle.double.icon').click(() => {
            var width = this.$el.outerWidth();
            var factor = Math.min(0, dir);
            this.$el.css('right', (factor * width) + 'px');
            this.$('.angle.double.icon').css('transform', 'rotate(' + (rot += 180) + 'deg)');
            dir *= -1;
        });
    }

    dropSprite(file) {
        // this.lib.sprite.addImage(file);
    }
}

export default Sidebar;