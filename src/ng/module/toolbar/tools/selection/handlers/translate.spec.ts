import { PixiService, SpriteEntity } from "ng/module/pixi/idx";
import { SelectionTranslateHandler } from "./translate";
import { SelectionContainer } from "../container";
import { Point } from "pixi.js";

describe('SelectionTranslateHandler', () => {

  let translate: SelectionTranslateHandler;
  let service: PixiService;
  let container: SelectionContainer;

  beforeEach(() => {
    service = new PixiService();
    service.setUp({ nativeElement: document.createElement('canvas') }, { });
    container = new SelectionContainer();
    service.scene.addChild(container);
    translate = new SelectionTranslateHandler(container, service);
  });

  describe('initial', () => {
    it('should set up mouse* event handlers and the unselected handler', () => {
      const mousedown = container.listeners('mousedown');
      const mousemove = container.listeners('mousemove');
      const unselected = container.listeners('unselected');
      expect(mousedown.find(fn => fn === translate.mousedown)).toBe(translate.mousedown, 'mousedown not registered');
      expect(mousemove.find(fn => fn === translate.mousemove)).toBe(translate.mousemove, 'mousemvoe not registered');
      expect(unselected.find(fn => fn === translate.unselected)).toBe(translate.unselected, 'unselected not registered');
    });
  });

  describe('mousedown', () => {
    it('should begin handling and set the cursor to move', () => {
      translate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      expect(container.isHandling).toBe(true, 'Is not handling');
      expect(container.currentHandler).toBe(translate, 'Wrong handler');
      expect(service.view.style.cursor).toBe('move', 'Wrong cursor');
    });

    it('should not do anything if container is already handling', () => {
      container.beginHandling({});
      let called = false;
      container.beginHandling = function() { called = true; };
      translate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      expect(called).toBe(false, 'Still called');
    });
  });

  describe('mouseup', () => {
    it('should end handling and reset the cursor if is handling', () => {
      translate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      translate.mouseup(<any>{ });
      expect(container.isHandling).toBe(false, 'Still handling');
      expect(service.view.style.cursor).toBe('', 'Cursor not reset');
    });

    it('should not do anything if container is not handling', () => {
      let called = false;
      container.endHandling = function() { called = true; };
      translate.mouseup(<any>{ });
      expect(called).toBe(false, 'Still called');
    });

    it('should not do anything if container is handled by someone else', () => {
      container.beginHandling({ })
      let called = false;
      container.endHandling = function() { called = true; };
      translate.mouseup(<any>{ });
      expect(called).toBe(false, 'Still called');
    });

    it('should be triggered via window.mouseup', () => {
      translate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      let called = false;
      container.endHandling = function() { called = true; };
      const event = new MouseEvent('mouseup');
      window.dispatchEvent(event);
      expect(called).toBe(true, 'Not called');
    });
  });

  describe('mousemove', () => {
    it('should move the container by the moved distance and emit "update" on the container, if handling', () => {
      const oldPos = new Point(container.position.x, container.position.y);
      translate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      let emitted = false;
      container.on('update', () => emitted = true);
      translate.mousemove(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(50, 20) },
      });
      expect(emitted).toBe(true, 'Not triggered');
      expect(container.position.x).toBe(oldPos.x + 50, 'Wrong new x position');
      expect(container.position.y).toBe(oldPos.y + 20, 'Wrong new y position');
    });

    it('should not do anything if container is not handling', () => {
      let called = false;
      container.endHandling = function() { called = true; };
      translate.mousemove(<any>{ });
      expect(called).toBe(false, 'Still called');
    });

    it('should not do anything if container is handled by someone else', () => {
      container.beginHandling({ })
      let called = false;
      container.endHandling = function() { called = true; };
      translate.mousemove(<any>{ });
      expect(called).toBe(false, 'Still called');
    });
  });

  describe('unselected', () => {
    it('should reset the container position if nothing is selected', () => {
      container.position.set(1000, 5000)
      translate.unselected();
      expect(container.position.x).toBe(0, 'x value not reset');
      expect(container.position.y).toBe(0, 'y value not reset');
    });
    it('should not reset if something is still selected', () => {
      container.select([new SpriteEntity(), new SpriteEntity()]);
      container.position.set(1000, 5000)
      translate.unselected();
      expect(container.position.x).not.toBe(0, 'x value reset');
      expect(container.position.y).not.toBe(0, 'y value reset');
    });
  });

});
