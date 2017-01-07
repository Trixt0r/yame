import { File } from '../../../../common/component/file';
import { Point } from '../../../../common/component/point';
import { Color } from '../../../../common/component/color';
import { Component, component } from '../../../../common/component';
import { Renderer } from '../renderer';

import * as _ from 'underscore';
import * as path from 'path';

export class SpriteRenderer extends Renderer {

    _value: any;

    @component color: Color;

    @component skew: Point;

    @component texture: File;

    constructor(name: string, sprite: PIXI.Sprite) {
        super(name, sprite);
        sprite.anchor.set(0.5, 0.5);
        delete this._value.options;
        delete this._value.alpha;
        this._value.texture = new File('texture', sprite.texture.baseTexture.imageUrl);
        this._value.color = new Color('color', {
            alpha: sprite.alpha,
            hex: sprite.tint.toString(16)
        });
        this._value.skew = new Point('skew', sprite.skew);

        this.color.alpha.on('change', alpha => this.sprite.alpha = alpha);
        this.color.hex.on('change', hex => this.sprite.tint = parseInt(hex, 16));
        this.skew.x.on('change', x => this.sprite.skew.x = x);
        this.skew.y.on('change', y => this.sprite.skew.y = y);

        this.delegateOn('change:x', this.skew, 'change')
            .delegateOn('change:y', this.skew, 'change');

        this.texture.on('change', (texture, old) => {
            this.sprite.texture = PIXI.Texture.fromImage(path.resolve(texture));
            // Since texture get loaded asynchronously we also have to delegate
            // the change event the same way
            if (this.sprite.texture.baseTexture.isLoading)
                this.sprite.texture.on('update', () => this.trigger('change', texture, old));
            else
                this.trigger('change', texture, old);
        });

        this.delegateOn('change:x', this.skew, 'change')
            .delegateOn('change:y', this.skew, 'change')
            .delegateOn('change:alpha', this.color, 'change')
            .delegateOn('change:hex', this.color, 'change');
    }

    /** @inheritdoc */
    get type(): string {
        return 'sprite';
    }

    /**
     * Shortcut for accessing the sprite.
     * @readonly
     * @type {PIXI.Sprite}
     */
    get sprite(): PIXI.Sprite {
        return <PIXI.Sprite>this.displayObject;
    }

    /** @inheritdoc */
    copy(): Renderer {
        let sprite = new PIXI.Sprite(PIXI.Texture.fromImage(this.sprite.texture.baseTexture.imageUrl));
        sprite.anchor.set(this.sprite.anchor.x, this.sprite.anchor.y);
        sprite.skew.set(this.sprite.skew.x, this.sprite.skew.y);
        sprite.tint = this.sprite.tint;
        sprite.blendMode = this.sprite.blendMode;
        let copy = super.copy(sprite);
        return copy;
    }

    /** @inheritdoc */
    toJSON(options?: any): any {
        let re = super.toJSON(options);
        // Set the path relative to the project file
        re.texture = path.relative(options.parentPath, re.texture);
        return re;
    }

    /** @inheritdoc */
    fromJSON(json: any, options?: any): SpriteRenderer {
        // Resolve the relative path properly
        json.texture = path.resolve(options.parentPath, json.texture);
        super.fromJSON(json, options);
        return this;
    }
}