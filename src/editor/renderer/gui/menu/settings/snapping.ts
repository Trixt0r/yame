import View from '../../../../../core/renderer/view/abstract';
import Input from '../../../../../core/renderer/view/input';

import * as SELECTION from '../../../interaction/selection';
import EDITOR from '../../../globals';

export class Snapping extends View {

    constructor(options: any = { }) {
        super(options);

        let angleSnapping = new Input({id: 'angleSnapping'});

        (<any>$('#snapToGrid'))
            .first()
            .checkbox(SELECTION.snapToGrid ? 'check' : 'uncheck')
            .checkbox({
                onChecked: () => SELECTION.setSnapToGrid(true),
                onUnchecked: () => SELECTION.setSnapToGrid(false),
            });

        (<any>$('#snapToAngle'))
            .first()
            .checkbox(SELECTION.snapToAngle ? 'check' : 'uncheck')
            .checkbox({
                onChecked: () => { SELECTION.setSnapToAngle(true); angleSnapping.$el.removeAttr('disabled') },
                onUnchecked: () => { SELECTION.setSnapToAngle(false); angleSnapping.$el.attr('disabled', '')},
            });
        angleSnapping.value = String(SELECTION.angleSnap)
        angleSnapping.$el.on('keyup change blur', () => {
            let newAngle = parseFloat(angleSnapping.value);
            if (!isNaN(newAngle)) SELECTION.setAngleSnap(newAngle);
        });

        if (SELECTION.snapToAngle)
            angleSnapping.$el.removeAttr('disabled');
    }
}

export default Snapping;