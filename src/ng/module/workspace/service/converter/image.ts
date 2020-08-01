import { ImageAsset } from 'common/asset/image';
import { FileContent } from 'common/content/file';
import { AssetService } from '../asset';

import * as _ from 'lodash';

/**
 * Converts the given file content into an image asset instance.
 *
 * @export
 * @param {FileContent} file
 * @returns {ImageAsset} The converted image asset.
 */
export default function(file: FileContent, service?: AssetService): Promise<ImageAsset> {
  const asset = new ImageAsset();

  asset.id = file.path; // The asset id is the full path
  asset.content = _.extend({}, file);
  return Promise.resolve(asset);
}
