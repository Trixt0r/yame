import { AssetPreviewComponent } from '../component/assets/component/preview/interface';
import { DirectoryGroupComponent } from '../component/groups/component/group/directory';
import { Asset } from '../../../../common/asset';
import { AssetGroup } from '../../../../common/asset/group';
import { GroupComponent } from '../component/groups/component/group/abstract';
import { Injectable, Type } from '@angular/core';

/**
 * Components map definition
 *
 * @interface PreviewComponents
 */
interface PreviewComponents<T extends Asset> {

  [key: string]: Type<AssetPreviewComponent>;

}

/**
 * The asset component service allows you to register component classes for rendering
 * an asset item in a certain way and maybe add some more functionality to an asset component.
 *
 * @export
 * @class AssetComponentService
 */
@Injectable()
export class AssetComponentService {

  // Internal map of component classes
  private previewComponents: PreviewComponents<Asset> = { };

  /**
   * Registers a component class for the given asset type.
   *
   * @param {string} type The asset type.
   * @param {Type<AssetPreviewComponent>} clazz The group component class
   */
  registerPreview<T extends Asset>(type: string, clazz: Type<AssetPreviewComponent>) {
    this.previewComponents[type] = clazz;
  }

  /**
   * Returns the group component class for the given type or asset.
   *
   * @param {(string | Asset)} typeOrAsset
   * @returns {Type<AssetPreviewComponent>} The asset preview component class
   */
  getPreview(typeOrAsset: string | Asset): Type<AssetPreviewComponent> {
    return this.previewComponents[ typeof typeOrAsset === 'string' ? typeOrAsset : typeOrAsset.type ];
  }
}
