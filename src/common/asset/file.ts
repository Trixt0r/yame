import { FileContent } from '../content/file';
import { Asset } from '../asset';

/**
 * A file asset contains file information, such as path, size, etc.
 * @see {FileContent} for more information.
 *
 * @export
 * @abstract
 * @class FileAsset
 * @implements {Asset}
 */
export class FileAsset extends Asset {

  /** @inheritdoc */
  type = 'file';

  /** @inheritdoc */
  content!: FileContent;

}
