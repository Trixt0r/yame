import EDITOR from '../globals';

import * as Backbone from 'backbone';
import * as _ from 'underscore';

import { ImageDropHandler } from '../../../core/renderer/drop/image';
import DropManager from '../../../core/renderer/drop/manager';
import Library from './sidebar/library';
import Layers from './sidebar/layers';

import { Menu } from '../../../core/renderer/view/tabs';

import View from '../../../core/renderer/view/abstract';
import { Accordion, SubAccordion } from '../../../core/renderer/view/accordion';
import Map from '../../../core/renderer/scene/map';

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
    properties: View;

    constructor() {
        super({ id: 'resources' });

        let resizer = new View({ className: 'hor-resizer' });
        this.add(resizer);
        let minWidth = 600, collapseThreshold = 200;
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
                if (newWidth < minWidth - collapseThreshold) {
                    this.css['width'] = '10px';
                    this.css['min-width'] = '10px';
                }
                else {
                    this.css['min-width'] = minWidth + 'px';
                    this.css['width'] = Math.min(window.innerWidth - ($('.zoom').first().outerWidth(true) + $('.zoom').first().position().left*2), Math.max(minWidth, newWidth)) + 'px';
                }
            sizeFactor = this.$el.outerWidth(true)/window.innerWidth;
            }
        });

        $(window).on('resize', () => {
            let newWidth = this.$el.outerWidth(true);

            if (newWidth <= minWidth) return;

            newWidth = window.innerWidth * sizeFactor;
            this.css['width'] = Math.min(window.innerWidth - ($('.zoom').first().outerWidth(true) + $('.zoom').first().position().left*2), Math.max(minWidth, newWidth)) + 'px';
        });

        this.layers = new Layers();
        this.lib = new Library();

        this.add([this.layers, this.lib]);
    }

    dropSprite(file) {
        // this.lib.sprite.addImage(file);
    }
}

export default Sidebar;