import { PixiAppNotInitializedException } from './exception/service/not-initialized';
import { Grid } from './utils/grid';
import { Camera } from './utils/camera';
import { PixiService } from './service';
import * as PIXI from 'pixi.js';

interface ViewRef {
  nativeElement: { offsetWidth: number; offsetHeight: number };
}

describe('PixiService', () => {
  let service: PixiService;

  let viewRef: ViewRef;

  beforeEach(() => {
    viewRef = {
      nativeElement: {
        offsetWidth: 0,
        offsetHeight: 0,
      },
    };
    service = new PixiService();
  });

  afterEach(() => {
    if (service.app) return service.dispose();
  });

  describe('setUp', () => {
    it('should not have a defined pixi.js app before setUp', () => {
      expect(service.app).toBeUndefined('An app is defined');
      expect(service.scene).toBeUndefined('A scene is defined');
    });

    it('should have a pixi.js app with a scene after setUp', () => {
      service.setUp(viewRef, {});
      expect(service.app).toBeDefined('No pixi.js application defined');
      expect(service.app instanceof PIXI.Application).toBe(true, 'Not a valid pixi.js application');
      expect(service.scene).toBeDefined('No scene defined');
      expect(service.scene instanceof PIXI.Container).toBe(true, 'Not a valid pixi.js container');
    });

    it('should not change app on successive setUp', () => {
      service.setUp(viewRef, {});
      const app = service.app;
      for (let i = 0; i < 10; i++) {
        service.setUp(viewRef, {});
        expect(app).toBe(service.app, 'App instance changed');
      }
    });
  });

  describe('resize', () => {
    it('should not be able to resize before setUp', () => {
      let thrown = false;
      try {
        service.resize();
      } catch (e) {
        expect(e instanceof PixiAppNotInitializedException).toBe(true);
        expect(e.message).toEqual('Can\'t resize');
        thrown = true;
      }
      expect(thrown).toBe(true, 'PixiAppNotInitializedException has not been thrown');
    });

    it('should be able to resize after setUp', () => {
      service.setUp(viewRef, {});
      expect(() => service.resize()).not.toThrowError('Can\t resize');
    });

    it('should not resize if nothing changed', () => {
      service.setUp(viewRef, {});
      expect(service.resize()).toBe(false, 'The renderer has been resized');
    });

    it('should not resize if the dimensions have initial values', () => {
      service.setUp(viewRef, {});
      viewRef.nativeElement.offsetWidth = 0;
      viewRef.nativeElement.offsetHeight = 0;
      expect(service.resize()).toBe(false, 'The renderer has been resized');
    });

    it('should resize if the width changed', () => {
      service.setUp(viewRef, {});
      viewRef.nativeElement.offsetWidth = 1;
      const re = <PIXI.Point>service.resize();
      expect(re).not.toBeFalsy('The renderer has not been resized');
      expect(re.x).toBe(1, 'The width did not change');
      expect(re.y).toBe(viewRef.nativeElement.offsetHeight, 'The height changed');
    });

    it('should resize if the height changed', () => {
      service.setUp(viewRef, {});
      viewRef.nativeElement.offsetHeight = 1;
      const re = <PIXI.Point>service.resize();
      expect(re).not.toBeFalsy('The renderer has not been resized');
      expect(re.x).toBe(viewRef.nativeElement.offsetWidth, 'The width changed');
      expect(re.y).toBe(1, 'The height did not change');
    });

    it('should resize if the width and the height changed', () => {
      service.setUp(viewRef, {});
      viewRef.nativeElement.offsetWidth = 1;
      viewRef.nativeElement.offsetHeight = 1;
      const re = <PIXI.Point>service.resize();
      expect(re).not.toBeFalsy('The renderer has not been resized');
      expect(re.x).toBe(1, 'The width did not change');
      expect(re.y).toBe(1, 'The height did not change');
    });
  });
});
