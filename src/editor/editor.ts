import * as console from 'console';
import { Menu } from './gui/menu';
import {Pixi} from './gui/pixi';
import {Sidebar} from './gui/sidebar';
import { Tools } from './gui/tools';
import { Selection } from './interaction/tools/selection';
import { Brush } from './interaction/tools/brush';
import { Map } from '../core/scene/map';
import { Camera } from '../core/scene/camera';

import {Input} from '../core/view/input';

import EDITOR from './globals';

import * as SELECTION from './interaction/selection';

var Pubsub = require('backbone').Events;

export class Editor {

    menu: Menu;
    pixi: Pixi;
    sidebar: Sidebar;
    tools: Tools;
    managers

    constructor() {
        this.menu = new Menu( {id: 'main-menu'});
        this.pixi = new Pixi();
        this.sidebar = new Sidebar();
        this.tools = new Tools();

        // Init the default tools first
        this.tools.addTool(new Selection());
        // this.tools.addTool(new Brush());
        // Notify everyone that the toolbar is ready to use
        Pubsub.trigger('tools:ready', this.tools);

        console.log('test');

        // this.pixi.imageDropHandler.registerHandler((file, e) => this.sidebar.dropSprite(file));
    }

}
