import { Button  as Btn } from '../../../core/view/button';
import { Icon } from '../../../core/view/icon';

/**
 * A button for the tools view with an icon and a tooltip.
 */
export class Button extends Btn {

    private _icon: Icon;

    constructor(icon: string, tooltip: string) {
        super({
            className: 'item',
            tagName: 'a',
            attributes: { href: 'javascript:void(0)' }
        });
        this.tooltip = tooltip;
        this._icon = new Icon({iconName: icon});
        this.add(this._icon);
    }

    /**
     * @returns {Icon} The icon view of this button.
     */
    get icon(): Icon {
        return this._icon;
    }
}
