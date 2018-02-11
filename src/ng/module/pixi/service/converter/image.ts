import { ImageAsset } from "../../../../../common/asset/image";

/**
 * Converts the given image asset into a sprite.
 *
 * @export
 * @param {ImageAsset} asset
 * @returns {Promise<PIXI.Sprite>} Resolves the created sprite as soon as the texture has been loaded.
 */
export default function(asset: ImageAsset): Promise<PIXI.Sprite> {
  let sprite = new PIXI.Sprite(PIXI.Texture.fromImage(asset.content.path));
  sprite.anchor.set(0.5);
  let baseTexture = sprite.texture.baseTexture;
  if (baseTexture.hasLoaded)
    return Promise.resolve(sprite);
  else if (baseTexture.isLoading)
    return new Promise((resolve, reject) => {
      baseTexture.once('loaded', () => {
        baseTexture.off('error', null, this);
        resolve(sprite);
      }, this);
      baseTexture.once('error', e => {
        baseTexture.off('loaded', null, this);
        reject(new Error(`Texture for '${asset.content.path}' could not be created`));
      }, this);
    });
  else
    return Promise.reject(new Error(`Texture for '${asset.content.path}' could not be created`));
};
