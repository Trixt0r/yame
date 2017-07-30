import { FileContent } from './file';
import { GroupContent } from './group';

/**
 * The content representation of an directory in the file system.
 *
 * @export
 * @interface DirectoryContent
 * @extends {(AssetGroupContent<DirectoryAsset | FileAsset>)}
 */
export interface DirectoryContent extends GroupContent<DirectoryContent | FileContent> {
  path: string;
  name: string;
}
