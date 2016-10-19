import { Menu } from './renderer/gui/menu';
import {Pixi} from './renderer/gui/pixi';
import {Sidebar} from './renderer/gui/sidebar';
import { Tools } from './renderer/gui/tools';
import { Selection } from './renderer/interaction/tools/selection';
import { Brush } from './renderer/interaction/tools/brush';

import * as SELECTION from './renderer/interaction/selection';

var Pubsub = require('backbone').Events;

export class Editor {

    menu: Menu;
    pixi: Pixi;
    sidebar: Sidebar;
    tools: Tools;

    constructor() {
        this.menu = new Menu( {id: 'main-menu'});
        this.pixi = new Pixi();
        this.sidebar = new Sidebar();
        this.tools = new Tools();

        // Init the default tools first
        this.tools.addTool(new Selection());

        // Notify everyone that the toolbar is ready to use
        Pubsub.trigger('tools:ready', this.tools);
    }

}

export default Editor