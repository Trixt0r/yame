import { SpriteEntity } from "./sprite";
import { SpriteEntityException } from "../exception/entity/sprite";
import * as _ from 'lodash';

describe('Scene', () => {
  describe('Sprite', () => {

    let entity: SpriteEntity;

    beforeEach(() => {
      entity = new SpriteEntity(void 0, 'a sprite');
    });

    describe('initial', () => {
      it('should have a pixi sprite', () => {
        expect(entity.sprite).toBeDefined('No pixi sprite defined');
        expect(entity.sprite instanceof PIXI.Sprite).toBe(true, 'Wrong type for internal sprite');
      });

      it('should have a centered anchor', () => {
        expect(entity.sprite.anchor.x).toBe(0.5, 'Horizontal anchor is not centered');
        expect(entity.sprite.anchor.y).toBe(0.5, 'Vertical anchor is not centered');
      });
    });

    describe('texture', () => {
      it('should change the texture of the internal sprite on texture change', () => {
        entity.texture = PIXI.Texture.fromImage('');
        expect(entity.sprite.texture).toBe(entity.texture, 'Textures are not the same');
      });

      it('should emit the texture:loaded event if the base texture is already loaded', () => {
        let handler = { fn: function() { } };
        spyOn(handler, 'fn');
        entity.on('texture:loaded', handler.fn);
        let texture = PIXI.Texture.fromImage('');
        texture.baseTexture.hasLoaded = true;
        entity.texture = texture;
        expect(handler.fn).toHaveBeenCalledTimes(1);
        expect(entity.textureLoaded).toBe(true, 'Wrong texture loaded state');
        expect(entity.textureLoading).toBe(false, 'Wrong texture loading state');
      });

      it('should emit the texture:loaded event if the base texture emitted the loaded event', done => {
        PIXI.Texture.fromImage('assets/grid.png').baseTexture.destroy(); // make sure the texture has not been loaded yet
        entity.texture = PIXI.Texture.fromImage('assets/grid.png');
        entity.on('texture:loaded', function() {
          expect(entity.textureLoaded).toBe(true, 'Wrong texture loaded state');
          expect(entity.textureLoading).toBe(false, 'Wrong texture loading state');
          expect(entity.texture.baseTexture.listeners('error', true)).toBe(false, 'Error handler has not been removed');
          done();
        });
        expect(entity.textureLoaded).toBe(false, 'Wrong texture loaded state');
        expect(entity.textureLoading).toBe(true, 'Wrong texture loading state');
      });

      it('should emit the texture:error event if the base texture emitted the error event', done => {
        entity.texture = PIXI.Texture.fromImage(_.uniqueId());
        entity.on('texture:error', function(texture, err) {
          expect(entity.textureLoaded).toBe(false, 'Wrong texture loaded state');
          expect(entity.textureLoading).toBe(false, 'Wrong texture loading state');
          expect(entity.texture.baseTexture.listeners('loaded', true)).toBe(false, 'Loaded handler has not been removed');
          expect(err instanceof SpriteEntityException).toBe(true, 'Wrong exception type');
          expect(err.message).toEqual('Source failed to load');
          done();
        });
        expect(entity.textureLoaded).toBe(false, 'Wrong texture loaded state');
        expect(entity.textureLoading).toBe(true, 'Wrong texture loading state');
      });

      it('should emit the texture:error event if the base texture has not loaded and is not loading', done => {
        let texture = PIXI.Texture.fromImage(_.uniqueId());
        texture.baseTexture.isLoading = false;
        texture.baseTexture.hasLoaded = false;
        entity.on('texture:error', function(texture, err) {
          expect(entity.textureLoaded).toBe(false, 'Wrong texture loaded state');
          expect(entity.textureLoading).toBe(false, 'Wrong texture loading state');
          expect(entity.texture.baseTexture.listeners('loaded', true)).toBe(false, 'Loaded handler has not been removed');
          expect(entity.texture.baseTexture.listeners('error', true)).toBe(false, 'Error handler has not been removed');
          expect(err instanceof SpriteEntityException).toBe(true, 'Wrong exception type');
          expect(err.message).toEqual('Invalid loading state');
          done();
        });
        entity.texture = texture;
      });

      it('should not listen to previous base texture events', () => {
        entity.texture = PIXI.Texture.fromImage('');
        let prev = entity.texture;
        entity.texture = PIXI.Texture.fromImage(_.uniqueId());
        expect(prev.listeners('loaded', true)).toBe(false, 'Loaded handler has not been removed');
        expect(prev.listeners('error', true)).toBe(false, 'Loaded handler has not been removed');
      });
    });

    describe('clone', () => {
      it('should resolve a sprite entity and have another id', done => {
        entity.clone()
          .then(clone => {
            expect(clone instanceof SpriteEntity).toBe(true, 'A sprite entity has not been resolved');
            expect(clone.id).not.toEqual(entity.id, 'Id has been copied');
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });
    });

  });
});
