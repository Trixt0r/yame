import { Component } from '../../../common/component';

export class Renderer<T extends PIXI.Container> extends Component<T> {

    /** @inheritdoc */
    get type(): string {
        return 'renderer';
    }

    /** @inheritdoc */
    copy(value?: T, constructor?: typeof Renderer ): Renderer<T> {
        if (!value)
            value = <T>new PIXI.Container();
        let copy;
        if (constructor)
            copy = new constructor(this._name, value);
        else
            copy = new Renderer<T>(this._name, value);
        copy.value.position.set(this.value.position.x, this.value.position.y);
        copy.value.scale.set(this.value.scale.x, this.value.scale.y);
        copy.value.pivot.set(this.value.pivot.x, this.value.pivot.y);
        copy.value.skew.set(this.value.skew.x, this.value.skew.y);
        copy.value.rotation = this.value.rotation;
        copy.value.alpha = this.value.alpha;
        copy.value.visible = this.value.visible;
        return copy;
    }
}

export class SpriteRenderer extends Renderer<PIXI.Sprite> {

    /** @inheritdoc */
    get type(): string {
        return 'sprite';
    }

    /** @inheritdoc */
    copy(): SpriteRenderer {
        let copy = super.copy(new PIXI.Sprite(PIXI.Texture.fromImage(this.value.texture.baseTexture.imageUrl)), SpriteRenderer);
        copy.value.anchor.set(this.value.anchor.x, this.value.anchor.y);
        copy.value.tint = this.value.tint;
        copy.value.blendMode = this.value.blendMode;
        return copy;
    }
}

export class TileRenderer extends Renderer<PIXI.extras.TilingSprite> {
    /** @inheritdoc */
    get type(): string {
        return 'tile';
    }
}

export class MeshRenderer extends Renderer<PIXI.mesh.Mesh> {
    /** @inheritdoc */
    get type(): string {
        return 'mesh';
    }
}

export class ShapeRenderer extends Renderer<PIXI.Graphics> {
    /** @inheritdoc */
    get type(): string {
        return 'shape';
    }
}