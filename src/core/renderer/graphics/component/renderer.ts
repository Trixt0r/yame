import { Component } from '../../../common/component';

import * as path from 'path';
import * as _ from 'underscore';

export class Renderer
       extends Component<{ displayObject?: PIXI.Container,
                           options?: Component<any> }> {

    constructor(name: string, displayObject: PIXI.Container) {
        super(name, { });
        this._value.displayObject = displayObject;
    }

    /** @inheritdoc */
    get type(): string {
        return 'renderer';
    }

    /**
     * The display object of this renderer.
     * @readonly
     * @type {PIXI.Container}
     */
    get displayObject(): PIXI.Container {
        return this._value.displayObject;
    }

    /** @inheritdoc */
    copy(value?: PIXI.Container): Renderer {
        if (!value)
            value = new PIXI.Container();
        let copy = new Renderer(this._name, value);
        value.position.set(this.displayObject.position.x, this.displayObject.position.y);
        value.scale.set(this.value.displayObject.x, this.displayObject.scale.y);
        value.pivot.set(this.displayObject.pivot.x, this.displayObject.pivot.y);
        value.skew.set(this.displayObject.skew.x, this.displayObject.skew.y);
        value.rotation = this.displayObject.rotation;
        value.alpha = this.displayObject.alpha;
        value.visible = this.displayObject.visible;
        return copy;
    }

    /** @inheritdoc */
    toJSON(options?: any): any {
        return {
            alpha: this.displayObject.alpha,
            visible: this.displayObject.visible
        };
    }

    /** @inheritdoc */
    fromJSON(json: any, options?: any): Renderer {
        this.displayObject.alpha = json.alpha === void 0 ? 1 : json.alpha;
        this.displayObject.visible = json.visible === void 0 ? true : json.visible;
        return this;
    }
}

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

export class TileRenderer extends Renderer {
    /** @inheritdoc */
    get type(): string {
        return 'tile';
    }
}

export class MeshRenderer extends Renderer {
    /** @inheritdoc */
    get type(): string {
        return 'mesh';
    }
}

export class ShapeRenderer extends Renderer {
    /** @inheritdoc */
    get type(): string {
        return 'shape';
    }
}