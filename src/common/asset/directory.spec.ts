import { AssetGroup } from './group';
import { DirectoryAsset } from './directory';

describe('DirectoryAsset', () => {
  it('should extend an asset group', () => expect( new DirectoryAsset() instanceof AssetGroup).toBe(true));

  it('should have type "directory"', () => expect( new DirectoryAsset().type).toBe('directory'));
});
