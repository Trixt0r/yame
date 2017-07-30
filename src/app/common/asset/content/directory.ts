import { FileAsset } from '../file';
import { DirectoryAsset } from '../directory';
import { AssetGroupContent } from './group';

/**
 * The content representation of an directory in the file system.
 *
 * @export
 * @interface DirectoryContent
 * @extends {(AssetGroupContent<DirectoryAsset | FileAsset>)}
 */
export interface DirectoryAssetContent extends AssetGroupContent<DirectoryAsset | FileAsset> {
  path: string;
  name: string;
}
