import View from './abstract';
import Range from './range';
import Button from './button';
import Icon from './icon';
import Camera from '../scene/camera';

export class Zoom extends View {

    private range: Range;

    constructor(public camera: Camera) {
        super({
            className: 'zoom'
        });

        var minusBtn = new Button({className: 'ui left icon attached button'});
        minusBtn.add(new Icon({iconName: 'minus'}));
        minusBtn.on('click', () => camera.zoom -=camera.zoomStep);
        this.add(minusBtn);

        this.range = new Range({
            min: camera.minZoom * 100,
            max: camera.maxZoom * 100,
            start: camera.zoom * 100
        });

        this.add(this.range);

        var plusBtn = new Button({className: 'ui right icon attached button'});
        plusBtn.add(new Icon({iconName: 'plus'}));
        plusBtn.on('click', () => camera.zoom += camera.zoomStep);
        this.add(plusBtn);

        camera.on('update', () => this.range.value = camera.zoom * 100 );
        this.range.on('change', value => camera.zoom = value / 100);
    }

    /** @inheritdoc */
    events(): Backbone.EventsHash {
        return {
            'mousewheel': e => {
                let delta = (<any>e.originalEvent).wheelDelta;
                if (delta > 0)
                    this.camera.zoom += this.camera.zoomStep;
                else if (delta < 0)
                    this.camera.zoom -= this.camera.zoomStep;
                e.stopPropagation();
            }
        }
    }
}

export default Zoom;