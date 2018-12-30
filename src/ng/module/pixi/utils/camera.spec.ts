import { Camera } from './camera';

interface EventHandler {
  fn(): any;
}

describe('Camera', () => {
  let cam: Camera;
  let container: PIXI.DisplayObject;

  beforeEach(() => {
    cam = new Camera();
    container = new PIXI.DisplayObject();
  });

  describe('constructor', () => {
    it('should have a target position reference', () => {
      expect(cam.targetPosition).toBeDefined('No target reference is defined');
    });

    it('should have a positive zoomStep', () => {
      expect(cam.zoomStep).toBeDefined('The zoomStep is not defined');
      expect(cam.zoomStep).toBeGreaterThan(0, 'The zoomStep is not positive');
    });
  });

  describe('attach/detach', () => {
    it('should not be attached to any display object', () => {
      expect(cam.isAttached()).toBe(false, 'The camera is attached');
    });

    it('should be attached to a display object after attaching it', () => {
      cam.attach(container);
      expect(cam.isAttached()).toBe(true, 'The camera is not attached');
    });

    it('should be attached to the correct display object after attaching it', () => {
      cam.attach(container);
      expect(cam.container).toBe(container, 'The camera is not attached to the correct display object');
    });

    it('should not be attached after detaching it from the previously attached display object', () => {
      cam.attach(container);
      cam.detach();
      expect(cam.isAttached()).toBe(false, 'The camera is still attached');
    });

    it('should have zoom = 1 after detaching', () => {
      cam.attach(container);
      cam.detach();
      expect(cam.zoom).toBe(1, 'The camera zoom has not been reset');
    });
  });

  describe('zoom', () => {
    let updateSpy: jasmine.Spy;
    let updateHandler: EventHandler;

    beforeEach(() => {
      cam.attach(container);
      updateHandler = { fn: () => {} };
      updateSpy = spyOn(updateHandler, 'fn');
      cam.on('updated', updateHandler.fn);
    });

    it('should have the same zoom as the container the camera is attached to', () => {
      expect(cam.zoom).toBe(Math.max(container.scale.x, container.scale.y), 'Parent scale and zoom are not in sync');
    });

    it('should not zoom immediately to the given value', () => {
      cam.zoom = 2;
      expect(cam.zoom).not.toBe(2, 'Zoomed immediately to the given value');
    });

    it('should zoom towards the given value', () => {
      const prev = cam.zoom;
      cam.zoom = 2;
      expect(cam.zoom).toBeGreaterThan(prev, 'Zoomed immediately to the given value');
    });

    it('should apply the zoom on the display object the camera is attached to', () => {
      const prev = container.scale.x;
      cam.zoom = 2;
      expect(container.scale.x).not.toBe(prev, 'New zoom has not been applied to display object');
    });

    it('should not zoom immediately to the set target position', () => {
      cam.targetPosition.set(50, 50);
      cam.zoom = 2;
      expect(cam.position.x).not.toBe(50);
      expect(cam.position.y).not.toBe(50);
    });

    it('should move away from the set target position if zooming in', () => {
      const prevX = cam.position.x;
      const prevY = cam.position.y;
      cam.targetPosition.set(50, 50);
      const oldDist = Math.sqrt((prevX - cam.targetPosition.x) ** 2 + (prevY - cam.targetPosition.y) ** 2);
      cam.zoom = 2;
      const newX = cam.position.x;
      const newY = cam.position.y;
      const newDist = Math.sqrt((newX - cam.targetPosition.x) ** 2 + (newY - cam.targetPosition.y) ** 2);
      expect(newDist).toBeGreaterThan(oldDist, 'The new distance is not greater than the old');
    });

    it('should move towards the set target position if zooming out', () => {
      const prevX = cam.position.x;
      const prevY = cam.position.y;
      cam.targetPosition.set(50, 50);
      const oldDist = Math.sqrt((prevX - cam.targetPosition.x) ** 2 + (prevY - cam.targetPosition.y) ** 2);
      cam.zoom = 0.5;
      const newX = cam.position.x;
      const newY = cam.position.y;
      const newDist = Math.sqrt((newX - cam.targetPosition.x) ** 2 + (newY - cam.targetPosition.y) ** 2);
      expect(newDist).toBeLessThan(oldDist, 'The new distance is not less than the old');
    });

    it('should have the wished zoom after zooming various iterations', () => {
      const targetZoom = 1.5;
      const steps = Math.ceil(Math.abs(targetZoom - cam.zoom) / cam.zoomStep);
      for (let i = 0; i < steps; i++) cam.zoom = targetZoom;
      expect(cam.zoom).toBe(targetZoom, `Did not reach target zoom after ${steps} iterations`);
    });

    it('should not update after the wished zoom has been reached', () => {
      const targetZoom = 1.5;
      const steps = Math.ceil(Math.abs(targetZoom - cam.zoom) / cam.zoomStep);
      for (let i = 0; i < steps; i++) cam.zoom = targetZoom;
      cam.zoom = targetZoom;
      expect(updateSpy.calls.all().length).toBe(steps, `The update event has been emitted too often`);
    });

    it('should zoom by zoomStep', () => {
      const prev = cam.zoom;
      cam.zoom = 2;
      expect(cam.zoom).toBe(prev + cam.zoomStep, 'The zoom has not been increased by zoomStep');
    });

    it('should not exceed maxZoom', () => {
      cam.maxZoom = 1;
      cam.zoom = 2;
      expect(cam.zoom).toBe(cam.maxZoom, 'Zoom exceeded the maxZoom');
    });

    it('should constraint to maxZoom if the current zoom exceed maxZoom', () => {
      cam.zoom = 2;
      cam.maxZoom = 1;
      expect(cam.zoom).toBe(cam.maxZoom, 'Zoom exceeded the maxZoom');
    });

    it('should not fall below minZoom', () => {
      cam.minZoom = 1;
      cam.zoom = 0.5;
      expect(cam.zoom).toBe(cam.minZoom, 'Zoom fell below minZoom');
    });

    it('should constraint to minZoom if the current zoom is below minZoom', () => {
      cam.zoom = 0.5;
      cam.minZoom = 1;
      expect(cam.zoom).toBe(cam.minZoom, 'Zoom fell below minZoom');
    });

    it('should emit the update event if there has been performed a zoom', () => {
      cam.zoom = 2;
      expect(updateSpy.calls.all().length).toBe(1, 'The update event has not been emitted');
    });

    it('should not emit the update event if there has not been performed a zoom (e.g. zoom not changed)', () => {
      cam.zoom = 1;
      expect(updateSpy.calls.all().length).toBe(0, 'The update event has been emitted');
    });

    it('should emit the update event if the position gets set', () => {
      cam.position = new PIXI.Point(50, 50);
      expect(updateSpy.calls.all().length).toBe(1, 'The update event has not been emitted');
    });
  });
});
