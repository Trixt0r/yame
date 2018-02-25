
import { PixiAssetConverter } from './converter';
import { Asset } from '../../../../common/asset';
import { PixiInvalidConverterException } from '../exception/service/invalid-converter';
import { PixiAssetNotSupportedException } from '../exception/service/asset-not-supported';
import { Entity } from '../scene/entity';

class MyAsset extends Asset {
  type = 'myType';
}

class UnkownAsset extends Asset {
  type = 'unkownType';
}

class MyEntity extends Entity {
  clone(): Promise<Entity> {
    throw new Error("Method not implemented.");
  }
}

class MyEntity2 extends Entity {
  clone(): Promise<Entity> {
    throw new Error("Method not implemented.");
  }
}

function convert(asset: Asset): Promise<MyEntity> {
  return Promise.resolve(new MyEntity());
}

function convert2(asset: Asset): Promise<MyEntity2> {
  return Promise.resolve(new MyEntity2());
}

describe('PixiAssetConverter', () => {

  let converter: PixiAssetConverter;

  beforeEach(() => {
    converter = new PixiAssetConverter();
  });

  describe('register and get', () => {
    it ('should register a converter for the asset type "myType"', done => {
      converter.register('myType', convert);
      converter.get(new MyAsset())
        .then((object) => {
          expect(object).toBeDefined('Nothing resolved');
          expect(object).not.toBeNull('Resolved object is null');
          expect(object instanceof Entity).toBe(true, 'No entity object resolved');
          done();
        }).catch(() => {
          fail('Nothing resolved');
        });
    });

    it ('should throw an PixiInvalidConverterException if the registered function has a wrong signature', () => {
      let fn = function() { return Promise.resolve(null); };
      try {
        converter.register('myType', fn)
      } catch (e) {
        expect(e instanceof PixiInvalidConverterException).toBe(true, 'No instance of PixiInvalidConverterException has been thrown')
      }
      expect(() => converter.register('myType', fn)).toThrowError('Expected converter function to accept 1 argument, but found 0.');
    });

    it ('should throw an PixiInvalidConverterException for an unknown asset type', done => {
     converter.get(new UnkownAsset())
      .then(() => fail('Should not resolve for type "unkownType"'))
      .catch(e => {
        expect(e instanceof PixiAssetNotSupportedException).toBe(true, 'No instance of PixiInvalidConverterException has been thrown');
        done();
      });
    });

    it ('should allow to override a converter function for an asset type', done => {
      converter.register('myType', convert);
      let asset = new MyAsset();
      converter.get(asset)
        .then(re => {
          expect(!(re instanceof MyEntity2)).toBe(true, 'The incorrect converter is defined');
          converter.register('myType', convert2);
          return converter.get(asset)
        })
        .then((re) => {
          expect(re instanceof MyEntity2).toBe(true, 'The converter has not been overriden');
          done();
        })
      .catch(() => fail('No object has been resolved'));
    });
  });

});
