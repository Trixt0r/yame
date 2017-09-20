import { Asset } from '../asset';
import { FileAsset } from './file';

describe('FileAsset', () => {
  it('should extend an asset', () => expect( new FileAsset() instanceof Asset).toBe(true));

  it('should have type "file"', () => expect( new FileAsset().type).toBe('file'));
});
