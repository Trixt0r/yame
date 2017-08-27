import { FileAsset } from './file';
import { AssetGroup } from './group';
import { Asset } from '../asset';
import { DirectoryAssetContent } from "./content/directory";

/**
 * A directory asset contains directory information, such as path and a list of its direct members.
 * @see {DirectoryAssetContent} for more information.
 *
 * @export
 * @abstract
 * @class FileAsset
 * @implements {Asset}
 */
export class DirectoryAsset extends AssetGroup<DirectoryAsset | FileAsset> {

  /** @inheritdoc */
  get type(): string {
    return 'directory';
  }

  /** @inheritdoc */
  content: DirectoryAssetContent;

}
