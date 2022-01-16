import { Injectable } from '@angular/core';
import { Asset } from 'common/asset';
import { createAssetComponent, createColorComponent, createGroupComponent, SceneComponent } from 'common/scene';
import { Deserialize, Convert } from '../decorators';

/**
 * Service for providing image asset specific functionality,
 * like converting assets and (de-)serializing components.
 */
@Injectable({ providedIn: 'root' })
export class ImageAssetService {
  /**
   * A list of asset types which are allowed to be classified as images.
   */
  static readonly ALLOWED_TYPES: readonly string[] = ['png', 'jpg', 'jpeg', 'gif', 'svg'];

  /**
   * Converts the given asset to a list of components representing an image.
   *
   * @param asset The asset to convert.
   */
  @Convert(...ImageAssetService.ALLOWED_TYPES)
  async convert(asset: Asset): Promise<SceneComponent[]> {
    const color = createColorComponent('sprite.color', 'sprite');
    color.red = 255;
    color.green = 255;
    color.blue = 255;
    color.alpha = 1;
    const assetComp = createAssetComponent('sprite.texture', asset.id, 'sprite');
    assetComp.allowedTypes = [...ImageAssetService.ALLOWED_TYPES];
    const sprite = createGroupComponent('sprite', ['sprite.texture', 'sprite.color']);
    sprite.allowedMemberTypes = [];
    sprite.allowedMemberItems = [];
    return [sprite, assetComp, color];
  }

  /**
   * Returns component data for components with the `sprite.texture` id.
   */
  @Deserialize({ id: 'sprite.texture' })
  async deserialize(): Promise<Partial<SceneComponent>> {
    return { allowedTypes: [...ImageAssetService.ALLOWED_TYPES] };
  }
}
