import { Grid } from './utils/grid';
import { Camera } from './utils/camera';
import { PixiService } from './service';
import * as PIXI from 'pixi.js';

interface ViewRef {
  nativeElement: {offsetWidth: number, offsetHeight: number}
}

describe('PixiService', () => {

  let service: PixiService;

  let viewRef: ViewRef;

  beforeEach(() => {
    viewRef = {
      nativeElement: {
        offsetWidth: 0,
        offsetHeight: 0
      }
    };
    service = new PixiService();
  });

  describe('setUp', () => {
    it('should not have a defined pixi.js app before setUp', () => {
      expect(service.app).toBeUndefined('An app is defined');
      expect(service.scene).toBeUndefined('A scene is defined');
    });

    it('should have a pixi.js app with a scene after setUp', () => {
      service.setUp(viewRef, { });
      expect(service.app).toBeDefined('No pixi.js application defined');
      expect(service.app instanceof PIXI.Application).toBe(true, 'Not a valid pixi.js application');
      expect(service.scene).toBeDefined('No scene defined');
      expect(service.scene instanceof PIXI.Container).toBe(true, 'Not a valid pixi.js container');
    });

    it('should not change app on successive setUp', () => {
      service.setUp(viewRef, { });
      let app = service.app;
      for (let i = 0; i < 10; i++) {
        service.setUp(viewRef, { });
        expect(app).toBe(service.app, 'App instance changed');
      }
    });
  });

  describe('attachCamera', () => {
    it('should not be able to initialize a camera before setUp', () => {
      expect(() => service.attachCamera(false))
        .toThrow("Can't attach a camera if the pixi application is not initialized!");
    });

    it('should be able to initialize a camera after setUp', () => {
      service.setUp(viewRef, { });
      expect(() => service.attachCamera(false))
        .not.toThrow("Can't attach a camera if the pixi application is not initialized!");
    });

    it('should have a camera instance after attaching it', () => {
      service.setUp(viewRef, { });
      service.attachCamera();
      expect(service.camera).toBeDefined('Camera is not defined');
      expect(service.camera instanceof Camera).toBe(true, 'The attached camera is not a camera');
    });

    it('should not change the camera instance on successive attachments', () => {
      service.setUp(viewRef, { });
      service.attachCamera();
      let cam = service.camera;
      for (let i = 0; i < 10; i++) {
        service.attachCamera();
        expect(cam).toBe(service.camera, 'Camera instance changed');
      }
    });

    it('should not register an update handler on the camera if no grid is defined', () => {
      service.setUp(viewRef, { });
      service.attachCamera();
      expect(service.camera.listeners('update').length).toBe(0, 'An update handler on the camera has been registered');
    });

    it('should register an update handler on the camera if a grid was defined', () => {
      service.setUp(viewRef, { });
      service.initGrid();
      service.attachCamera();
      expect(service.camera.listeners('update').length).toBe(1, 'No update handler registered on camera');
    });
  });

  describe('initGrid', () => {
    it('should not be able to initialize a grid before setUp', () => {
      expect(() => service.initGrid())
        .toThrow("Can't initialize a grid if the pixi application is not initialized!");
    });

    it('should be able to initialize a grid after setUp', () => {
      service.setUp(viewRef, { });
      expect(() => service.initGrid())
        .not.toThrow("Can't initialize a grid if the pixi application is not initialized!");
    });

    it('should have a grid instance after initializing it', () => {
      service.setUp(viewRef, { });
      service.initGrid();
      expect(service.grid).toBeDefined('Grid is not defined');
      expect(service.grid instanceof Grid).toBe(true, 'The initialized grid is not a grid');
    });

    it('should not change the grid instance on successive inits', () => {
      service.setUp(viewRef, { });
      service.initGrid();
      let grid = service.grid;
      for (let i = 0; i < 10; i++) {
        service.initGrid();
        expect(grid).toBe(service.grid, 'Grid instance changed');
      }
    });

    it('should not access the camera if it has not been attached yet', () => {
      service.setUp(viewRef, { });
      service.initGrid();
      expect(service.camera).toBeUndefined('A camera has been defined');
    });

    it('should register an update handler on the camera after a camera was attached', () => {
      service.setUp(viewRef, { });
      service.attachCamera();
      service.initGrid();
      expect(service.camera.listeners('update').length).toBe(1, 'No update handler registered on camera');
    });
  });

  describe('resize', () => {
    it('should not be able to resize before setUp', () => {
      expect(() => service.resize())
        .toThrow("Can't resize if the pixi application is not initialized!");
    });

    it('should be able to resize after setUp', () => {
      service.setUp(viewRef, { });
      expect(() => service.resize())
        .not.toThrow("Can't resize if the pixi application is not initialized!");
    });

    it('should not resize if nothing changed', () => {
      service.setUp(viewRef, { });
      expect(service.resize()).toBe(false, 'The renderer has been resized');
    });

    it('should not resize if the dimensions have initial values', () => {
      service.setUp(viewRef, { });
      viewRef.nativeElement.offsetWidth = 0;
      viewRef.nativeElement.offsetHeight = 0;
      expect(service.resize()).toBe(false, 'The renderer has been resized');
    });

    it('should resize if the width changed', () => {
      service.setUp(viewRef, { });
      viewRef.nativeElement.offsetWidth = 1;
      let re = service.resize();
      expect(re).not.toBe(false, 'The renderer has not been resized');
      expect(re.x).toBe(1, 'The width did not change');
      expect(re.y).toBe(viewRef.nativeElement.offsetHeight, 'The height changed');
    });

    it('should resize if the height changed', () => {
      service.setUp(viewRef, { });
      viewRef.nativeElement.offsetHeight = 1;
      let re = service.resize();
      expect(re).not.toBe(false, 'The renderer has not been resized');
      expect(re.x).toBe(viewRef.nativeElement.offsetWidth, 'The width changed');
      expect(re.y).toBe(1, 'The height did not change');
    });

    it('should resize if the width and the height changed', () => {
      service.setUp(viewRef, { });
      viewRef.nativeElement.offsetWidth = 1;
      viewRef.nativeElement.offsetHeight = 1;
      let re = service.resize();
      expect(re).not.toBe(false, 'The renderer has not been resized');
      expect(re.x).toBe(1, 'The width did not change');
      expect(re.y).toBe(1, 'The height did not change');
    });
  });

});
