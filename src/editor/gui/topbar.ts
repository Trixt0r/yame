import { View } from '../../core/view/abstract';
import Selection = require('../interaction/selection');
import Resources = require('../resources');

export class Topbar extends View {

    events() {
        return <any>{
            'click #snap-to-grid': 'snapToGrid',
            'change #grid-width': (ev) => this.grid.width = $(ev.target).val(),
            'change #grid-height': (ev) => this.grid.height = $(ev.target).val()
        };
    }

    constructor(world, public grid) {
        super({ id: 'topbar' });

        var $zoom = this.$('.zoom');

        var slider = $zoom.slider({
            step: 0.01,
            ticks: [.1, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2, 3, 4, 5, 6],
            ticks_positions: [0, 12.5, 25, 37.5, 50, 58.3, 66.6, 75, 80, 85, 90, 95, 100],
            ticks_snap_bounds: 0.05,
            value: 1,
            min: .1,
            max: 5,
            formatter: val => Math.round(val * 100) + '%'
        });

        this.$('#grid-width').val(this.grid.width);
        this.$('#grid-height').val(this.grid.height);

        slider.on('change', (ev: any) => world.getCamera().zoom = ev.value.newValue);

        world.getCamera().on('zoom', () => $zoom.slider('setValue', world.getCamera().zoom, false, false));

        var dir = -1;
        var rot = 0;
        this.$('.glyphicon-eject').click(() => {
            var height = this.$el.outerHeight();
            var factor = Math.min(0, dir);
            this.$el.css('top', (factor * height) + 'px');
            this.$('.glyphicon-eject').css('transform', 'rotate(' + (rot += 180) + 'deg)');
            dir *= -1;
        });

        // var imageDropHandler = new Resources.ImageDropHandler();
        // imageDropHandler.registerHandler((file, e) => console.log(file));
        // Resources.registerFileDrop(this.$('.selectables'), imageDropHandler);
    }

    snapToGrid(ev) {
        Selection.snapToGrid = $(ev.target).prop('checked');
    }
}
