import { Asset } from '../asset';
import { ImageAsset } from './image';

describe('ImageAsset', () => {
  it('should extend an asset', () => expect( new ImageAsset() instanceof Asset).toBe(true));

  it('should have type "file"', () => expect( new ImageAsset().type).toBe('image'));
});
