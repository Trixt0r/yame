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

/**
 * Represents the sidebar in the editor.
 * @class Sidebar
 * @extends {View}
 */
export class Sidebar extends View {

    /** @type {Accordion} accordion Actual content view. */
    accordion: Accordion;

    /** @type {View} resizer Reference to the resizer view. */
    resizer: View;

    /** @type {Layers} layers Reference to the layers group. */
    layers: Layers;

    /** @type {Library} lib Reference to the explorer group. */
    lib: Library;

    constructor() {
        super({ id: 'resources' });

        // Init accordion
        this.accordion = new Accordion({ className: 'ui styled accordion'});
        this.add(this.accordion);

        // Init the resizer
        let resizer = this.resizer = new View({ className: 'hor-resizer' });
        this.add(resizer);
        // Initialize resize calculation stuff
        let minWidth = 600, collapseThreshold = 200;
        let prevEvent = null, prevWidth = minWidth;
        let sizeFactor = prevWidth/window.innerWidth;
        // Setup event handlers for resizing
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

        // Initialize the default accordion parts
        this.lib = new Library();
        this.layers = new Layers();
        // Add them
        this.accordion.addGroup(this.lib).addGroup(this.layers);

        Pubsub.trigger('sidebar:ready', this);
    }

    dropSprite(file) {
        // this.lib.sprite.addImage(file);
    }
}

export default Sidebar;