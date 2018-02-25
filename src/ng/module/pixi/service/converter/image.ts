import { ImageAsset } from "../../../../../common/asset/image";
import { SpriteEntity } from "../../scene/sprite";

/**
 * Converts the given image asset into a sprite.
 *
 * @export
 * @param {ImageAsset} asset
 * @returns {Promise<SpriteEntity>} Resolves the created sprite as soon as the texture has been loaded.
 */
export default function(asset: ImageAsset): Promise<SpriteEntity> {
  return new Promise((resolve, reject) => {
    let sprite = new SpriteEntity(PIXI.Texture.fromImage(asset.content.path));
    let t = Date.now();
    sprite.once('texture:loaded', () => {
      sprite.off('error', null, this);
      resolve(sprite);
    }, this);
    sprite.once('texture:error', (texture, e) => {
      sprite.off('loaded', null, this);
      reject(e);
    }, this);
  });
};
