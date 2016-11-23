import {Renderer} from '../renderer';

import * as _ from 'underscore';
import * as path from 'path';

export class SpriteRenderer extends Renderer {

    constructor(name: string, sprite: PIXI.Sprite) {
        super(name, sprite);
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
        let copy = super.copy(sprite);
        sprite.anchor.set(this.sprite.anchor.x, this.sprite.anchor.y);
        sprite.tint = this.sprite.tint;
        sprite.blendMode = this.sprite.blendMode;
        return copy;
    }

    /** @inheritdoc */
    toJSON(options?: any): any {
        return _.extend(super.toJSON(options), {
            texture: path.relative(options.parentPath, this.sprite.texture.baseTexture.imageUrl),
            anchor: {
                x: this.sprite.anchor.x,
                y: this.sprite.anchor.y
            },
            tint: this.sprite.tint
        });
    }

    /** @inheritdoc */
    fromJSON(json: any, options?: any): SpriteRenderer {
        super.fromJSON(json, options);
        this.sprite.texture = PIXI.Texture.fromImage(path.resolve(options.parentPath, json.texture));
        this.sprite.texture.baseTexture.on('update', () => this.sprite.parent.pivot.set(this.sprite.texture.baseTexture.width/2, this.sprite.texture.baseTexture.height/2));
        return this;
    }
}