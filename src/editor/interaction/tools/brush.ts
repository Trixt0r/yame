import {Tool} from '../tool';
import {Button} from '../../gui/tools/button';

export class Brush extends Tool {

    /** @override */
    getButton(): Button {
        return new Button('paint brush', 'Simple brush tool');
    }
}
