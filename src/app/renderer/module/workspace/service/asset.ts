import { AssetGroup } from '../../../../common/asset/group';
import { FileAsset } from '../../../../common/asset/file';
import { DirectoryAsset } from '../../../../common/asset/directory';
import { Asset } from '../../../../common/asset';
import { FileContent } from '../../../../common/content/file';
import { DirectoryContent } from '../../../../common/content/directory';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';

/**
 * Interface for a convert which is able to convert a fs resource to an asset.
 *
 * @interface FsConverter
 */
interface FsConverter {

  /**
   * @param {FileContent | DirectoryContent} source The content to convert to an asset.
   * @returns {FileAsset | DirectoryAsset} The converted asset.
   */
  (source: FileContent | DirectoryContent, service: AssetService): FileAsset | DirectoryAsset;

}

/**
 * Definition for the internal converters.
 *
 * @interface Converters
 */
interface Converters {

  [key: string]: FsConverter;

}

/**
 * Definition of the internal cache
 *
 * @interface Cache
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

  /**
   * Registers an new file system resource converter for a certain file type.
   *
   * @param {string} type The type of the resource, e.g. `directory`, `png`, `ogg`, etc.
   * @param {FsConverter} fn The converting routine
   * @memberof AssetService
   */
  registerFsConverter(type: string, fn: FsConverter) {
    this.converters[type] = fn;
  }

  /**
   * Converts the given content to a file or directory asset.
   *
   * If no converter is registered for the content type, a plain file asset will be returned.
   *
   * @param {(FileContent | DirectoryContent)} source The content source to convert.
   * @param {boolean} [cache=true] Whether to use cached assets if available.
   * @returns {(FileAsset | DirectoryAsset)} The converted result.
   */
  fromFs(source: FileContent | DirectoryContent, cache: boolean = true): FileAsset | DirectoryAsset {
    if (this.cache[source.path] && cache)
      return this.cache[source.path];
    let converter = this.converters[source.type];
    if (converter)
      return this.cache[source.path] = converter(source, this);
    else {
      let file = <FileContent>source;
      let asset = new FileAsset();
      asset.id = file.path;
      asset.content = _.extend({}, file);
      return this.cache[source.path] = asset;
    }
  }

  /**
   * Filters out all asset groups in the given root group and returns them.
   *
   * @param {AssetGroup<Asset>} root The root group
   * @returns {AssetGroup<Asset>[]} All direct asset groups inside the given root.
   */
  getGroups(root: AssetGroup<Asset>): AssetGroup<Asset>[] {
    return <AssetGroup<Asset>[]>root.members.filter(
      (member: any) => member instanceof AssetGroup || Array.isArray(member.members)
    );
  }

  /**
   * Filers out all assets for the given root group, i.e. non-groups and returns them.
   *
   * @param {AssetGroup<Asset>} root
   * @returns {Asset[]} All direct assets (not groups) inside the given root.
   */
  getAssets(root: AssetGroup<Asset>): Asset[] {
    return <Asset[]>root.members.filter(
      (member: any) => !(member instanceof AssetGroup) && !Array.isArray(member.members)
    );
  }

  /**
   * Returns all parents of the given asset by climbing the hierarchy up.
   *
   * @param {Asset} asset
   * @returns {AssetGroup<Asset>[]} A list of all parents of the given asset.
   */
  getParents(asset: Asset): AssetGroup<Asset>[] {
    let parents = [];
    let parent = asset;
    while (parent = parent.parent)
      parents.push(parent);
    return parents;
  }

}
