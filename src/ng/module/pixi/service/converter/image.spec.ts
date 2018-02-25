import convert from './image';
import { ImageAsset } from '../../../../../common/asset/image';
import * as PIXI from 'pixi.js';
import { SpriteEntity } from '../../scene/sprite';

describe('ImageAsset to Sprite converter function', () => {

  let image = new ImageAsset();
  image.content.path = 'assets/grid.png';
  let invalidImage = new ImageAsset();
  invalidImage.content.path = '';

  it('should resolve a sprite for an image which is not loaded yet', done => {
    convert(image)
      .then(sprite => {
        expect(sprite instanceof SpriteEntity).toBe(true, 'No sprite resolved');
        done();
      })
      .catch(e => fail('Nothing resolved'));
  });

  it('should resolve a sprite if is already loaded', done => {
    let spr = new SpriteEntity(PIXI.Texture.fromImage(image.content.path));
    expect(spr.texture.baseTexture.hasLoaded).toBe(true, 'Texture has not been loaded');
    convert(image)
      .then(sprite => {
        expect(sprite instanceof SpriteEntity).toBe(true, 'No sprite resolved');
        done();
      })
      .catch(e => fail('Nothing resolved'));
  });

  it('should reject if the image path is invalid', done => {
    convert(invalidImage)
      .then(() => fail('Should not resovle anything'))
      .catch(e => {
        expect(e instanceof Error).toBe(true, 'No error rejected');
        expect(e.message).toBe(`Source failed to load`, 'Wrong error message');
        done();
      });
  });

  it('should reject if not loading and has not loaded', done => {
    convert(invalidImage)
      .then(() => fail('Should not resovle anything'))
      .catch(() => {
        convert(invalidImage)
          .then(() => fail('Should not resovle anything'))
          .catch(e => {
            expect(e instanceof Error).toBe(true, 'No error rejected');
            expect(e.message).toBe(`Source failed to load`, 'Wrong error message');
            done();
          });
      });
  });

});
