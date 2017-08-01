import { MenuOption } from '../component/assets/interface/menu-option';
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
 * Components map definition
 *
 * @interface MenuOptions
 */
interface MenuOptions {

  [key: string]: MenuOption[];

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

  // Internal map of menus per asset type
  private menuOptions: MenuOptions = { };

  /**
   * Registers a component class for the given asset type.
   *
   * @param {string} type The asset type.
   * @param {Type<AssetPreviewComponent>} clazz The group component class.
   */
  registerPreview<T extends Asset>(type: string, clazz: Type<AssetPreviewComponent>) {
    this.previewComponents[type] = clazz;
  }

  /**
   * Returns the group component class for the given type or asset.
   *
   * @param {(string | Asset)} typeOrAsset
   * @returns {Type<AssetPreviewComponent>} The asset preview component class.
   */
  getPreview(typeOrAsset: string | Asset): Type<AssetPreviewComponent> {
    return this.previewComponents[ typeof typeOrAsset === 'string' ? typeOrAsset : typeOrAsset.type ];
  }

  /**
   * Registers an asset menu options for the given asset type.
   *
   * @param {string} type The asset type.
   * @param {MenuOption[]} option The list of options.
   */
  registerMenuOptions(type: string, option: MenuOption[]) {
    this.menuOptions[type] = option;
  }

  /**
   * Returns a list of menu options for the given type or asset.
   *
   * @param {string | Asset} typeOrAsset
   * @returns {MenuOption[]} A list of options. Will be empty if no options are available for the asset type.
   */
  getMenuOptions(typeOrAsset: string | Asset): MenuOption[] {
    return this.menuOptions[ typeof typeOrAsset === 'string' ? typeOrAsset : typeOrAsset.type ] || [];
  }
}
