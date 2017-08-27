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

  /** @type {string} The full path of the directory. */
  path: string;

  /** @type {string} The name of the directory. */
  name: string;

  /** @type {string} The type, i.e. always directory. */
  type: 'directory';
}
