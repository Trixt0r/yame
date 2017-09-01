import { Asset } from './asset';

class MyAsset extends Asset {
  type = 'my-asset';
}

describe('Asset', function() {

  it('should exist', () => expect(Asset != null).toBe(true) );

  it('should be extendable', () => expect(new MyAsset() instanceof Asset).toBe(true) );

  it('should have type', () => expect(typeof new MyAsset().type).toEqual('string'));

  it('should have type "my-asset"', () => expect(new MyAsset().type).toEqual('my-asset') );

  it('should have a content object', () => expect(new MyAsset().content).toBeDefined() );

  it('should have no parent', () => expect(new MyAsset().parent).toBeUndefined() );

  it('should have no id', () => expect(new MyAsset().id).toBeUndefined() );

});
