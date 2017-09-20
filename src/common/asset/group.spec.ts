import { Asset } from '../asset';
import { AssetGroup } from './group';

class MyAssetGroup extends AssetGroup<any> { }

describe('AssetGroup', () => {
  it('should extend an asset', () => expect( new MyAssetGroup() instanceof Asset).toBe(true));

  it('should have type "group"', () => expect( new MyAssetGroup().type).toBe('group'));

  it('should have members', () => expect( new MyAssetGroup().members).toBeDefined());
});
