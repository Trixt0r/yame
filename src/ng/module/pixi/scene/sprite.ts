import { Entity, EntityType } from "./entity";
import { Property } from "./property";
import { SpriteEntityException } from "../exception/entity/sprite";

/**
 * A sprite entity is an entity, which holds a pixi sprite instance as a child.
 *
 *
 * @class SpriteEntity
 * @extends {Entity}
 */
@EntityType('sprite')
export class SpriteEntity extends Entity {

  /** @type {PIXI.Sprite} The internal sprite to render. */
  protected internalSprite: PIXI.Sprite;

  /** @type {PIXI.Texture} The internal texture for the sprite. */
  @Property(false) texture: PIXI.Texture;

  private baseLoading: boolean = false;
  private baseLoaded: boolean = false;;

  constructor(texture?: PIXI.Texture, name?: string) {
    super(name);
    this.texture = texture;
    this.internalSprite = new PIXI.Sprite(texture);
    this.internalSprite.anchor.set(0.5);
    this.addChild(this.internalSprite);
    this.on('change:texture', (texture: PIXI.Texture, prev: PIXI.Texture) => {
      if (prev) {
        prev.baseTexture.off('loaded', null, this);
        prev.baseTexture.off('error', null, this);
      }
      this.internalSprite.texture = texture;
      this.handleTextureLoading();
    });
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

  /** @returns {PIXI.Sprite} The pixi sprite instance for this entity. */
  get sprite(): PIXI.Sprite {
    return this.internalSprite;
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
    let texture = this.texture;
    if (!texture) return; // Ignore this case
    let baseTexture = texture.baseTexture;
    if (baseTexture.hasLoaded) {
      this.baseLoaded = true;
      this.baseLoading = false;
      this.emit('texture:loaded', texture);
    } else if (baseTexture.isLoading) {
      this.baseLoaded = false;
      this.baseLoading = true;
      baseTexture.once('loaded', () => {
        baseTexture.off('error', null, this);
        this.baseLoaded = true;
        this.baseLoading = false;
        this.emit('texture:loaded', texture);
      }, this);
      baseTexture.once('error', () => {
        baseTexture.off('loaded', null, this);
        this.baseLoaded = false;
        this.baseLoading = false;
        this.emit('texture:error', texture, new SpriteEntityException('Source failed to load'));
      }, this);
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
    let sprite = new SpriteEntity(this.texture, `Copy of ${this.name}`);
    return Promise.resolve(sprite);
  }
}
