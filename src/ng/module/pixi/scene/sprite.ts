import { Entity, EntityType, EntityData } from './entity';
import { Property } from './property';
import { SpriteEntityException } from '../exception/entity/sprite';
import { Sprite, Texture, Point } from 'pixi.js';

/**
 * A sprite entity is an entity, which holds a pixi sprite instance as a child.
 *
 *
 * @class SpriteEntity
 * @extends {Entity}
 */
@EntityType('sprite')
export class SpriteEntity extends Entity {
  /** The internal sprite to render. */
  protected internalSprite: Sprite;

  /** The internal texture for the sprite. */
  @Property(false) texture: Texture;

  @Property({ type: 'color', export: true }) color: number;

  private baseLoading = false;
  private baseLoaded = false;

  constructor(texture?: Texture, name?: string) {
    super(name);
    this.texture = texture;
    this.internalSprite = new Sprite(texture);
    this.internalSprite.anchor.set(0.5);
    this.addChild(this.internalSprite);
    this.on('change:texture', (tex: Texture, prev: Texture) => {
      if (prev) {
        prev.baseTexture.off('loaded', null, this);
        prev.baseTexture.off('error', null, this);
      }
      this.internalSprite.texture = tex;
      this.handleTextureLoading();
    });

    this.on('change:color', (color: number) => {
      this.internalSprite.tint = color;
    });

    this.color = 0xffffff;

    setImmediate(() => this.handleTextureLoading());
  }

  /** @type {boolean} Whether the texture of this sprite is loading or not. */
  get textureLoading(): boolean {
    return this.baseLoading;
  }

  /** @type {boolean} Whether the texture of this sprite has been successfully loaded or not. */
  get textureLoaded(): boolean {
    return this.baseLoaded;
  }

  /** @returns The pixi sprite instance for this entity. */
  get sprite(): Sprite {
    return this.internalSprite;
  }

  parse(data: EntityData, from: string): Promise<SpriteEntity> {
    return super.parse(data, from)
            .then(() => {
              this.color = data.color;
              return this;
            });
  }

  /**
   * Handles the texture loading events and emits events for that.
   * If the texture has been loaded or is already loaded,
   * the `texture:loaded` event gets emitted with the texture as the parameter.
   * If an error occurred, the `texture:error` event gets emitted with the texture as the first parameter and the
   *
   * @returns {void}
   */
  protected handleTextureLoading() {
    const texture = this.texture;
    if (!texture) return; // Ignore this case
    const baseTexture = texture.baseTexture;
    if ((baseTexture as any).hasLoaded) {
      this.baseLoaded = true;
      this.baseLoading = false;
      this.emit('texture:loaded', texture);
    } else if ((baseTexture as any).isLoading) {
      this.baseLoaded = false;
      this.baseLoading = true;
      baseTexture.once(
        'loaded',
        () => {
          baseTexture.off('error', null, this);
          this.baseLoaded = true;
          this.baseLoading = false;
          this.emit('texture:loaded', texture);
        },
        this
      );
      baseTexture.once(
        'error',
        () => {
          baseTexture.off('loaded', null, this);
          this.baseLoaded = false;
          this.baseLoading = false;
          this.emit('texture:error', texture, new SpriteEntityException('Source failed to load'));
        },
        this
      );
    } else {
      baseTexture.off('error', null, this);
      baseTexture.off('loaded', null, this);
      this.baseLoaded = false;
      this.baseLoading = false;
      this.emit('texture:error', texture, new SpriteEntityException('Invalid loading state'));
    }
  }

  /** @inheritdoc */
  clone(): Promise<SpriteEntity> {
    const sprite = new SpriteEntity(this.texture, `Copy of ${this.name}`);
    return Promise.resolve(sprite);
  }

  /** @inheritdoc */
  containsPoint(point: Point): boolean {
    return this.sprite.containsPoint(point);
  }
}
