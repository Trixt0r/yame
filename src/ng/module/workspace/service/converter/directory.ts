import { AssetService } from '../asset';
import { DirectoryContent } from '../../../../../common/content/directory';
import { DirectoryAsset } from '../../../../../common/asset/directory';

/**
 * Converts the given directory content into an directory asset instance.
 *
 * @export
 * @param {DirectoryContent} directory
 * @returns {DirectoryAsset} The converted directory asset.
 */
export default function(directory: DirectoryContent, service: AssetService): Promise<DirectoryAsset> {
  let asset = new DirectoryAsset();

  asset.id = directory.path; // The asset id is the full path
  asset.content.path = directory.path;
  asset.content.name = directory.name;

  // Recursively iterate over all sub directories
  let promises = [];
  directory.children.forEach(child => {
    promises.push(
      service.fromFs(child)
        .then(childAsset => {
          childAsset.parent = asset;
          asset.members.push(childAsset);
        })
    );
  });
  return Promise.all(promises).then(() => asset);
}
