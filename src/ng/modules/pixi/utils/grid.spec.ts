import * as PIXI from 'pixi.js';
import { Grid } from './grid';

interface EventHandler {
  fn(): any;
}

describe('Grid', () => {
  let grid: Grid;
  let updateSpy: jasmine.Spy;
  let cacheGrowingSpy: jasmine.Spy;
  let cacheGrownSpy: jasmine.Spy;
  let grownAndUpdateSpy: jasmine.Spy;
  let updateHandler: EventHandler;
  let cacheGrowingHandler: EventHandler;
  let cacheGrownHandler: EventHandler;
  let grownAndUpdateHandler: EventHandler;

  beforeEach(() => {
    grid = new Grid(new PIXI.Container());
    const tex = Grid.getGridTexture();
    // Mock dimensions since we do not load the actual asset
    tex.frame.width = tex.baseTexture.width = 1600;
    tex.frame.height = tex.baseTexture.height = 1600;
    tex.baseTexture.hasLoaded = true;
    tex.baseTexture.isLoading = false;
    tex.baseTexture.emit('update', tex.baseTexture);

    updateHandler = { fn: () => {} };
    cacheGrowingHandler = { fn: () => {} };
    cacheGrownHandler = { fn: () => {} };
    grownAndUpdateHandler = { fn: () => {} };

    updateSpy = spyOn(updateHandler, 'fn');
    cacheGrowingSpy = spyOn(cacheGrowingHandler, 'fn');
    cacheGrownSpy = spyOn(cacheGrownHandler, 'fn');
    grownAndUpdateSpy = spyOn(grownAndUpdateHandler, 'fn');
    grid.on('update', updateHandler.fn);
    grid.on('cache:growing', cacheGrowingHandler.fn);
    grid.on('cache:grown', cacheGrownHandler.fn);
    grid.on('update', grownAndUpdateHandler.fn);
    grid.on('cache:grown', grownAndUpdateHandler.fn);
  });

  describe('static', () => {
    it('should have a grid texture', () => {
      expect(Grid.getGridTexture()).toBeDefined('A grid texture is not defined');
    });
  });

  describe('constructor', () => {
    it('should initialize the cache', () => {
      const tex = Grid.getGridTexture();
      tex.baseTexture.isLoading = true;
      const newGrid = new Grid(new PIXI.Container());
      tex.baseTexture.isLoading = false;
      newGrid.on('cache:grown', cacheGrownHandler.fn);
      tex.baseTexture.emit('update', tex.baseTexture);
      expect(cacheGrownSpy.calls.any()).toBe(true, 'Cache has not been initialized');
    });

    it('should not initialize the cache if the texture is not loaded yet', () => {
      const tex = Grid.getGridTexture();
      tex.baseTexture.isLoading = true;
      const newGrid = new Grid(new PIXI.Container());
      newGrid.on('cache:grown', cacheGrownHandler.fn);
      expect(cacheGrowingSpy.calls.any()).toBe(false, 'Cache has been initialized while texture is loading');
    });

    it('should be add the rendered container to the defined parent container', () => {
      expect(grid.container.children.indexOf(grid.renderedContainer)).toBeGreaterThan(-1);
    });
  });

  describe('update', () => {
    it('should emit the update event', () => {
      grid.update(100, 100);
      expect(updateSpy.calls.all().length).toBe(1, 'The update event has not been emitted');
    });

    it('should emit the update event and not grow the cache', () => {
      cacheGrownSpy.calls.reset();
      cacheGrowingSpy.calls.reset();
      grid.update(100, 100);
      expect(updateSpy.calls.all().length).toBe(1, 'The update event has not been emitted');
      expect(cacheGrowingSpy.calls.all().length).toBe(0, 'The cache:growing event has been emitted');
      expect(cacheGrownSpy.calls.all().length).toBe(0, 'The cache:grown event has been emitted');
    });

    // We use 3200 as a value since the default scale is 2

    it('should emit the update event and not grow the cache if the new size hits the cache limit', () => {
      cacheGrownSpy.calls.reset();
      cacheGrowingSpy.calls.reset();
      grid.update(3200 * 64, 3200);
      expect(updateSpy.calls.all().length).toBe(1, 'The update event has not been emitted');
      expect(cacheGrowingSpy.calls.all().length).toBe(0, 'The cache:growing event has been emitted');
      expect(cacheGrownSpy.calls.all().length).toBe(0, 'The cache:grown event has been emitted');
    });

    it('should emit the update event and grow the cache by 1 if the width has been exceeded', () => {
      cacheGrownSpy.calls.reset();
      cacheGrowingSpy.calls.reset();
      grid.update(3200 * 65, 3200);
      expect(updateSpy.calls.all().length).toBe(1, 'The update event has not been emitted');
      expect(cacheGrowingSpy.calls.all().length).toBe(1, 'The cache:growing event has not been emitted');
      expect(cacheGrownSpy.calls.all().length).toBe(1, 'The cache:grown event has not been emitted');
    });

    it('should emit the update event and grow the cache by 1 if the height has been exceeded', () => {
      cacheGrownSpy.calls.reset();
      cacheGrowingSpy.calls.reset();
      grid.update(3200, 3200 * 65);
      expect(updateSpy.calls.all().length).toBe(1, 'The update event has not been emitted');
      expect(cacheGrowingSpy.calls.all().length).toBe(1, 'The cache:growing event has not been emitted');
      expect(cacheGrownSpy.calls.all().length).toBe(1, 'The cache:grown event has not been emitted');
    });

    it('should emit the update event and grow the cache by 64 if the size has been exceeded by 1 row', () => {
      cacheGrownSpy.calls.reset();
      cacheGrowingSpy.calls.reset();
      grid.update(3200 * 64, 3200 * 2);
      expect(updateSpy.calls.all().length).toBe(1, 'The update event has not been emitted');
      expect(cacheGrowingSpy.calls.all().length).toBe(64, 'The cache:growing event has not been emitted');
      expect(cacheGrownSpy.calls.all().length).toBe(64, 'The cache:grown event has not been emitted');
    });

    it('should emit the update event after growing the cache', () => {
      grownAndUpdateSpy.calls.reset();
      grid.update(3200 * 65, 3200);
      expect(grownAndUpdateSpy.calls.first().args.length).toBe(0, 'The cache:grown event has not been emitted first');
      expect(grownAndUpdateSpy.calls.mostRecent().args.length).toBe(2, 'The update event has not been emitted last');
    });
  });

  describe('setters', () => {
    let changeContainerHandler: EventHandler;
    let changeWidthHandler: EventHandler;
    let changeHeightHandler: EventHandler;
    let changeContainerSpy: jasmine.Spy;
    let changeWidthSpy: jasmine.Spy;
    let changeHeightSpy: jasmine.Spy;

    beforeEach(() => {
      changeContainerHandler = { fn: () => {} };
      changeWidthHandler = { fn: () => {} };
      changeHeightHandler = { fn: () => {} };

      changeContainerSpy = spyOn(changeContainerHandler, 'fn');
      changeWidthSpy = spyOn(changeWidthHandler, 'fn');
      changeHeightSpy = spyOn(changeHeightHandler, 'fn');

      grid.on('change:container', changeContainerHandler.fn);
      grid.on('change:width', changeWidthHandler.fn);
      grid.on('change:height', changeHeightHandler.fn);
    });

    it('should remove the rendered container from the container the grid is attached to it changes', () => {
      const prevContainer = grid.container;
      const newContainer = new PIXI.Container();
      grid.container = newContainer;
      expect(prevContainer.children.indexOf(grid.renderedContainer)).toBeLessThan(0, 'The grid has not been removed');
      expect(newContainer.children.indexOf(grid.renderedContainer)).toBeGreaterThan(-1, 'The grid has not been added');
    });

    it('should emit the change:container event if the container changes', () => {
      grid.container = new PIXI.Container();
      expect(changeContainerSpy.calls.all().length).toBe(1, 'The change:container event has not been emitted');
    });

    it('should not emit the change:container event if the container did not change', () => {
      grid.container = grid.container;
      expect(changeContainerSpy.calls.all().length).toBe(0, 'The change:container event has been emitted');
    });

    it('should emit the change:width event if the width changes', () => {
      grid.width = 64;
      expect(changeWidthSpy.calls.all().length).toBe(1, 'The change:height event has not been emitted');
    });

    it('should not emit the change:width event if the width did not change', () => {
      grid.width = 32;
      expect(changeWidthSpy.calls.all().length).toBe(0, 'The change:width event has been emitted');
    });

    it('should emit the change:height event if the height changes', () => {
      grid.height = 64;
      expect(changeHeightSpy.calls.all().length).toBe(1, 'The change:height event has not been emitted');
    });

    it('should not emit the change:height event if the container did not change', () => {
      grid.height = 32;
      expect(changeHeightSpy.calls.all().length).toBe(0, 'The change:height event has been emitted');
    });

    it('should not fall below a grid width of 8', () => {
      grid.width = 4;
      expect(grid.width).toBe(8, 'The width fell below 8');
    });

    it('should not fall below a grid height of 8', () => {
      grid.height = 4;
      expect(grid.height).toBe(8, 'The height fell below 8');
    });
  });
});
