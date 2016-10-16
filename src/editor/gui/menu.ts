import { Settings } from './menu/settings';
import { File } from './menu/file';
import { View } from './../../core/view/abstract';


const Pubsub = require('backbone').Events;

export class Menu extends View {

    file: File;
    settings: Settings;

    constructor(options: any = { }) {
        super(options);
        this.file = new File({id: 'menu-file'});
        this.settings = new Settings({id: 'menu-settings'});
    }
}