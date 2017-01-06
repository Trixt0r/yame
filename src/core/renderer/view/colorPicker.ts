import { Color } from '../../common/component/color';
import { Component } from './component';
import * as _ from 'underscore';

import View from './abstract';
import Input from './input';

interface Options extends Backbone.ViewOptions<Backbone.Model> {
    component?: Color;
    title?: string;
    colorPicker?: any;
}

export class ColorPicker extends View implements Component<Color> {

    protected _input: Input;
    protected _title: View;
    protected spContainer: JQuery;

    protected _component: Color;

    constructor(options: Options = {title: 'color'}) {
        super(_.extend({
            className: 'ui fluid labeled input component color'
        }, options));

        this._title = new View({
            el: `<label class="ui label">${options.title}</label>`
        });
        this.add(this._title);

        this._input = new Input();
        this.add(this._input);
        let width = 0, height = 0, inTransition = false, intV;

        (<any>this._input.$el).spectrum(_.extend({
            color: '#fff',
            showAlpha: true,
            showInput: true,
            preferredFormat: 'hex',
            showPalette: true,
            showSelectionPalette: true,
            palette: [
                ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
                "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
                ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
                "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
                ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
                "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
                "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
                "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
                "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
                "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
                "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
                "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
                "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
                "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
            ],
            move: tinycolor => {
                this.apply();
                this.trigger('move', tinycolor);
            },
            show: tinycolor => {
                this.trigger('show', tinycolor);
                if (inTransition) return;
                if (!height) {
                    width = this.spContainer.outerWidth(true);
                    height = this.spContainer.outerHeight(true);
                }
                this.spContainer.addClass('no-anim');
                this.spContainer.css('height', 0);
                this.spContainer.css('width', 0);
                setTimeout(() => {
                    this.spContainer.removeClass('no-anim');
                    this.spContainer.css('height', `${height}px`);
                    this.spContainer.css('width', `${width}px`);
                    inTransition = true;
                    this.spContainer.one('transitionend', () => {
                        inTransition = false;
                        clearInterval(intV);
                        this.spContainer.css('height', '').css('width', '');
                    });
                });
            },
            hide: tinycolor => {
                this.apply();
                this.trigger('hide', tinycolor);
                if (inTransition) return;
                this.spContainer.css('width', `${width}px`);
                this.spContainer.css('height', `${height}px`);
                this.spContainer.addClass('no-anim not-hidden');
                setTimeout(() => {
                    this.spContainer.css('height', 0).css('width', 0);
                    this.spContainer.removeClass('no-anim');
                    inTransition = true;
                    this.spContainer.one('transitionend', () => {
                         this.spContainer.css('height', '').css('width', '');
                         this.spContainer.removeClass('not-hidden');
                         clearInterval(intV);
                         inTransition = false;
                     });
                });
            },
            beforeShow: tinycolor => this.trigger('beforeShow', tinycolor),
            dragstart: tinycolor => this.trigger('dragstart', tinycolor),
            dragstop: tinycolor => this.trigger('dragstop', tinycolor),
        }, options.colorPicker));

        this._title.$el.prependTo(this.$el);
        this.spContainer = $('.sp-container').last();
        this.$('.sp-replacer').addClass('ui fluid button');

        $('.sp-choose').removeClass()
            .addClass('ui icon positive tiny button attached right')
            .empty()
            .append('<i style="font-size: 15px;" class="checkmark icon" />');
        $('.sp-cancel').removeClass()
            .addClass('ui icon negative tiny button attached left')
            .empty()
            .append('<i class="remove icon" />');

        this.on('done:render', () => {
            this._title.$el.prependTo(this.$el);
            inTransition = false;
            this.spContainer.css('height', '').css('width', '');
            clearInterval(intV);
        });

        this.component = options.component || new Color(options.title);
    }

    /**
     * Applies the view values to the component.
     */
    private apply(): void {
        this.component.alpha.value = this.alpha;
        this.component.hex.value = this.color.toHex();
    }

    /** @returns {Input} The input view. */
    get input(): Input {
        return this._input;
    }

    /** @returns {View} The title view. */
    get title(): View {
        return this._title;
    }

    /**
     * Sets the color of this view.
     * @param  {string | any} color Any color string or object spectrum supports
     * @returns {void}
     */
    set color(color: string | any) {
        (<any>this._input.$el).spectrum('set', color);
    }

    /** @returns {string | any} The current color object or string. */
    get color(): string | any {
        return (<any>this._input.$el).spectrum('get');
    }

    /**
     * Sets the alpha of this color picker.
     * @param  {number} value Value between 0 und 1. Will be clamped.
     * @returns {void}
     */
    set alpha(value: number) {
        value = Math.min(1, Math.max(0, value));
        let color = this.color;
        color.setAlpha(value);
        let rgb = color.toRgbString();
        (<any>this._input.$el).spectrum('set', rgb);
    }

    /** @returns {number} The current alpha value. */
    get alpha(): number {
        return (<any>this.color)._a;
    }

    /** @inheritdoc */
    get component(): Color {
        return this._component;
    }

    /** @inheritdoc */
    set component(color) {
        // Make sure the we unsubscribe to the previous component
        if (this._component) {
            this._component.alpha.off('change', null, this);
            this._component.hex.off('change', null, this);
            this._component.off('name', null, this);
        }
        // and register to the new one
        this._component = color;
        this.color = color.hex.value;
        this.alpha = color.alpha.value;
        this._component.hex.on('change', hex => {
            this.color = hex;
            this.alpha = this.component.alpha.value;
        });
        this._component.alpha.on('change', alpha => this.alpha = alpha );
        this._title.$el.text(this._component.name);
    }
}

export default ColorPicker;