import Snapping from './settings/snapping';
import Grid from './settings/grid';
import Editor from '../../../editor';
import Input from '../../../../core/renderer/view/input';
import View from '../../../../core/renderer/view/abstract';

import * as SELECTION from '../../interaction/selection';
import EDITOR from '../../globals';

const Pubsub = require('backbone').Events;

export class Settings extends View {

    grid: Grid;
    snapping: Snapping;

    constructor(options: any = { }) {
        super(options);
        this.grid = new Grid( {id: 'menu-settings-grid'} );
        this.snapping = new Snapping( {id: 'menu-settings-snapping'} );
    }
}

export default Settings;