import Editor from '../../../../editor';
import Input from '../../../../../core/renderer/view/input';
import View from '../../../../../core/renderer/view/abstract';

import * as SELECTION from '../../../interaction/selection';
import EDITOR from '../../../globals';

const Pubsub = require('backbone').Events;

export class Grid extends View {

    constructor(options: any = { }) {
        super(options);

        let gridWidth = new Input({id: 'gridWidth'});
        let gridHeight = new Input({id: 'gridHeight'});

        Pubsub.on('editor:ready', (editor: Editor)=> {

            gridWidth.value = String(editor.pixi.grid.width);
            gridWidth.$el.on('keyup change blur', () => {
                let newWidth = parseFloat(gridWidth.value);
                if (!isNaN(newWidth) && SELECTION.grid.width != newWidth) {
                    SELECTION.grid.width = newWidth;
                    EDITOR.camera.trigger('update');
                }
            });
            gridHeight.value = String(editor.pixi.grid.height)
            gridHeight.$el.on('keyup change blur', () => {
                let newHeight = parseFloat(gridHeight.value);
                if (!isNaN(newHeight) && SELECTION.grid.height != newHeight) {
                    SELECTION.grid.height = newHeight;
                    EDITOR.camera.trigger('update');
                }
            });
        });
    }
}

export default Grid;