import {View} from './abstract';
import {Input} from './input';

import _ = require('underscore');

export class ColorPicker extends View {

    protected _input: Input;
    protected _title: View;
    protected spContainer: JQuery;

    constructor(options: any = {title: ''}) {
        super(_.extend({
            className: 'ui segment'
        }, options));

        this._title = new View({ el: `<div class="ui tiny header">${options.title}</div>` });
        this.add(this._title);

        this._input = new Input();
        this.add(this._input);
        let width = 0, height = 0, inTransition = false, intV;

        (<any>this._input.$el).spectrum(_.extend({
            move: tinycolor => this.trigger('move', tinycolor),
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
        this.$('.sp-replacer').addClass('fluid ui button');

        $('.sp-choose').removeClass().addClass('ui icon positive tiny button attached right').empty().append('<i style="font-size: 15px;" class="checkmark icon" />');
        $('.sp-cancel').removeClass().addClass('ui icon negative tiny button attached left').empty().append('<i class="remove icon" />');
        this.on('done:render', () => {
            this._title.$el.prependTo(this.$el);
            inTransition = false;
            this.spContainer.css('height', '').css('width', '');
            clearInterval(intV);
        });
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
}
