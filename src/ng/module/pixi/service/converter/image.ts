import { ImageAsset } from 'common/asset/image';
import { SpriteEntity } from 'ng/module/pixi/scene/sprite';
import { Texture } from 'pixi.js';

/**
 * Converts the given image asset into a sprite.
 *
 * @export
 * @param {ImageAsset} asset
 * @returns {Promise<SpriteEntity>} Resolves the created sprite as soon as the texture has been loaded.
 */
export default function(asset: ImageAsset): Promise<SpriteEntity> {
  return new Promise((resolve, reject) => {
    const sprite = new SpriteEntity(Texture.from(asset.content.path));
    sprite.once(
      'texture:loaded',
      () => {
        sprite.off('error', null, this);
        resolve(sprite);
      },
      this
    );
    sprite.once(
      'texture:error',
      (texture, e) => {
        sprite.off('loaded', null, this);
        reject(e);
      },
      this
    );
  });
}
