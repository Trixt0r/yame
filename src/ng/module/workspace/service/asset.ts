import { AssetGroup } from 'common/asset/group';
import { FileAsset } from 'common/asset/file';
import { DirectoryAsset } from 'common/asset/directory';
import { Asset } from 'common/asset';
import { FileContent } from 'common/content/file';
import { DirectoryContent } from 'common/content/directory';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';

/**
 * Interface for a converter which is able to convert a fs resource to an asset.
 *
 * @param source The content to convert to an asset.
 * @return The converted asset.
 */
type FsConverter = (source: FileContent | DirectoryContent, service: AssetService) => Promise<FileAsset | DirectoryAsset>;

/**
 * Definition for the internal converters.
 */
interface Converters {

  [key: string]: FsConverter;

}

/**
 * Definition of the internal cache.
 */
interface Cache {

  [key: string]: FileAsset | DirectoryAsset;

}

/**
 * The asset service is responsible for converting file and directory representations into asset representations.
 *
 * How a file or directory gets converted into an asset, is not implemented by the service itself.
 * The service has its own default converters for common use cases such as converting images to a sprite.
 * In order to convert a resource to an asset representation, you can register converters via the api.
 *
 * @export
 * @class AssetService
 */
@Injectable()
export class AssetService {

  // Internal map of registered converters
  private converters: Converters = { };

  // Internal cache for accessing assets directly without running any conversion
  private cache: Cache = { };

  private rootGroup: AssetGroup<Asset> | null = null;

  /**
   * Registers an new file system resource converter for a certain file type.
   *
   * @param type The type of the resource, e.g. `directory`, `png`, `ogg`, etc.
   * @param fn The converter function.
   */
  registerFsConverter(type: string, fn: FsConverter): void {
    this.converters[type] = fn;
  }

  /**
   * Returns the fs converter for the given asset type.
   *
   * @param type The asset type to check for
   * @returns {FsConverter} The fs converter for the given asset type or `undefined`.
   */
  getFsConverter(type: string): FsConverter {
    return this.converters[type];
  }

  /**
   * Converts the given content to a file or directory asset.
   *
   * If no converter is registered for the content type, a plain file asset will be returned.
   *
   * @param source The content source to convert.
   * @param [cache=true] Whether to use cached assets if available.
   * @return The converted result.
   */
  fromFs(source: FileContent | DirectoryContent, cache: boolean = true): Promise<FileAsset | DirectoryAsset> {
    if (this.cache[source.path] && cache)
      return Promise.resolve(this.cache[source.path]);
    const converter = this.converters[source.type];
    return (converter ? converter(source, this) : this.toFileAsset(source))
            .then(re => this.cache[source.path] = re)
  }

  /**
   * Creates a file asset from the given content.
   *
   * @param source The content to convert.
   * @return The converted result.
   */
  toFileAsset(source: FileContent | DirectoryContent): Promise<FileAsset> {
    const file = <FileContent>source;
    const asset = new FileAsset();
    asset.id = file.path;
    asset.content = _.extend({}, file);
    return Promise.resolve(asset);
  }

  /**
   * Filters out all asset groups in the given root group and returns them.
   *
   * @param root The root group
   * @return All direct asset groups inside the given root.
   */
  getGroups(root: AssetGroup<Asset>): AssetGroup<Asset>[] {
    if (!root.members) return [];
    return root.members.filter(
      member => member instanceof AssetGroup || Array.isArray((member as AssetGroup<Asset>).members)
    ) as AssetGroup<Asset>[];
  }

  /**
   * Filters out all assets for the given root group, i.e. non-groups and returns them.
   *
   * @param root
   * @return All direct assets (not groups) inside the given root.
   */
  getAssets(root: AssetGroup<Asset>): Asset[] {
    if (!root.members) return [];
    return root.members.filter(
      member => !(member instanceof AssetGroup) && !Array.isArray((member as AssetGroup<Asset>).members)
    );
  }

  getAssetsRecursive(root: AssetGroup<Asset> | null = this.rootGroup): Asset[] {
    if (!root) throw new Error('No root set');
    let assets = this.getAssets(root);
    this.getGroups(root)
      .forEach(group => assets = assets.concat(this.getAssetsRecursive(group)) );
    return assets;
  }

  /**
   * Returns all parents of the given asset by climbing the hierarchy up.
   *
   * @param asset
   * @return A list of all parents of the given asset.
   */
  getParents(asset: Asset): AssetGroup<Asset>[] {
    const parents = [];
    let parent = asset;
    while (parent = parent.parent)
      parents.push(parent);
    return parents as AssetGroup<Asset>[];
  }

  set root(root: AssetGroup<Asset> | null) {
    this.rootGroup = root;
  }

  get root(): AssetGroup<Asset> |null {
    return this.rootGroup;
  }

}
