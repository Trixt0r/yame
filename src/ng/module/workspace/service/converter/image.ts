import { ImageAsset } from 'common/asset/image';
import { FileContent } from 'common/content/file';
import { FileAsset } from 'common/asset/file';
import { AssetService } from '../asset';

import * as _ from 'lodash';
import { DirectoryContent } from 'common/content/directory';

/**
 * Converts the given file content into an image asset instance.
 *
 * @param file
 * @return The converted image asset.
 */
export default function(file: FileContent | DirectoryContent, service?: AssetService): Promise<ImageAsset> {
  const asset = new ImageAsset();

  asset.id = file.path; // The asset id is the full path
  asset.content = _.extend({}, file) as FileContent;
  return Promise.resolve(asset);
}
