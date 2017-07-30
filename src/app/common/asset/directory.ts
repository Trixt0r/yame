import { FileAsset } from './file';
import { AssetGroup } from './group';
import { Asset } from '../asset';
import { DirectoryAssetContent } from "./content/directory";

type FSAsset = DirectoryAsset | FileAsset;

/**
 * A directory asset contains directory information, such as path and a list of its children.
 * @see {DirectoryAssetContent} for more information.
 *
 * @export
 * @abstract
 * @class FileAsset
 * @implements {Asset}
 */
export class DirectoryAsset extends AssetGroup<FSAsset, DirectoryAssetContent> {

  /** @inheritdoc */
  get type(): string {
    return 'directory';
  }

}
