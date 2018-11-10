import { PixiService } from "ng/idx";
import { SelectionContainer } from "../container";
import { SelectionRotateHandler } from "./rotate";
import { SelectionRenderer } from "../renderer";
import { Point, Rectangle } from "pixi.js";
import { SpriteEntity } from "ng/module/pixi/idx";

describe('SelectionRotateHandler', () => {

  let rotate: SelectionRotateHandler;
  let service: PixiService;
  let container: SelectionContainer;
  let renderer: SelectionRenderer;

  beforeEach(() => {
    service = new PixiService();
    service.setUp({ nativeElement: document.createElement('canvas') }, { });
    container = new SelectionContainer();
    service.scene.addChild(container);
    renderer = new SelectionRenderer(service, container);
    rotate = new SelectionRotateHandler(container, renderer, service);
  });

  describe('initial', () => {
    it('should set up mouse* event handlers and the unselected handler', () => {
      const selected = container.listeners('selected');
      const unselected = container.listeners('unselected');
      const attached = renderer.listeners('attached');
      const detached = renderer.listeners('detached');
      const updated = renderer.listeners('updated');
      expect(attached.find(fn => fn === rotate.attached)).toBe(rotate.attached, 'attached not registered');
      expect(detached.find(fn => fn === rotate.detached)).toBe(rotate.detached, 'detached not registered');
      expect(updated.find(fn => fn === rotate.updated)).toBe(rotate.updated, 'updated not registered');
      expect(selected.find(fn => fn === rotate.selected)).toBe(rotate.selected, 'selected not registered');
      expect(unselected.find(fn => fn === rotate.unselected)).toBe(rotate.unselected, 'unselected not registered');

      rotate.areas.forEach((area, i) => {
        const mousedown = area.listeners('mousedown');
        const mousemove = area.listeners('mousemove');
        const mouseover = area.listeners('mouseover');
        const mouseout = area.listeners('mouseout');
        expect(mousedown.find(fn => fn === rotate.mousedown)).toBe(rotate.mousedown, `mousedown not registered ${i}`);
        expect(mousemove.find(fn => fn === rotate.mousemove)).toBe(rotate.mousemove, `mousemove not registered ${i}`);
        expect(mouseover.find(fn => fn === rotate.updateCursor)).toBe(rotate.updateCursor, `mouseover not registered ${i}`);
        expect(mouseout.find(fn => fn === rotate.resetCursor)).toBe(rotate.resetCursor, `mouseout not registered ${i}`);
      });
    });
  });

  describe('updateCursor', () => {
    it('should not change cursor if other handling', () => {
      container.beginHandling({ });
      rotate.updateCursor(<any>{});
      expect(service.view.style.cursor).toBe('', 'Cursor still set');
    });

    it('should change cursor if no one is handling', () => {
      rotate.updateCursor(<any>{});
      expect(service.view.style.cursor).toBe('url("assets/rotate-icon.svg"), pointer', 'Cursor not set');
    });

    it('should not change cursor if not handling', () => {
      container.beginHandling(rotate);
      rotate.updateCursor(<any>{});
      expect(service.view.style.cursor).toBe('url("assets/rotate-icon.svg"), pointer', 'Cursor not set');
    });
  });

  describe('resetCursor', () => {
    it('should not reset cursor if currently handling', () => {
      container.beginHandling(rotate);
      rotate.updateCursor();
      rotate.resetCursor(<any>{});
      expect(service.view.style.cursor).toBe('url("assets/rotate-icon.svg"), pointer', 'Cursor still reset');
    });

    it('should reset if called with an event argument', () => {
      rotate.updateCursor(<any>{});
      rotate.resetCursor(<any>{});
      expect(service.view.style.cursor).toBe('', 'Cursor not reset');
    });

    it('should not reset if not called with an event argument and mouseover emitted before', () => {
      rotate.updateCursor(<any>{});
      rotate.resetCursor();
      expect(service.view.style.cursor).toBe('url("assets/rotate-icon.svg"), pointer', 'Cursor still reset');
    });
  });

  describe('mousedown', () => {
    it('should begin handling', () => {
      rotate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      expect(container.isHandling).toBe(true, 'Is not handling');
      expect(container.currentHandler).toBe(rotate, 'Wrong handler');
    });

    it('should not do anything if container is already handling', () => {
      container.beginHandling({});
      let called = false;
      container.beginHandling = function() { called = true; };
      rotate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      expect(called).toBe(false, 'Still called');
    });
  });

  describe('mouseup', () => {
    it('should end handling and reset the cursor if is handling', () => {
      rotate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      rotate.mouseup();
      expect(container.isHandling).toBe(false, 'Still handling');
      expect(service.view.style.cursor).toBe('', 'Cursor not reset');
    });

    it('should not do anything if container is not handling', () => {
      let called = false;
      container.endHandling = function() { called = true; };
      rotate.mouseup();
      expect(called).toBe(false, 'Still called');
    });

    it('should not do anything if container is handled by someone else', () => {
      container.beginHandling({ })
      let called = false;
      container.endHandling = function() { called = true; };
      rotate.mouseup();
      expect(called).toBe(false, 'Still called');
    });

    it('should be triggered via window.mouseup', () => {
      rotate.mousedown(<any>{
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
    it('should rotate the container by the moved angle and emit "update" on the container, if handling', () => {
      container.rotation = Math.PI / 2;
      const oldAngle = container.rotation;
      rotate.mousedown(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(0, 0) },
      });
      let emitted = false;
      container.on('update', () => emitted = true);
      rotate.mousemove(<any>{
        stopped: false,
        currentTarget: container,
        data: { global: new Point(50, 20) },
      });
      expect(emitted).toBe(true, 'Not triggered');
      const newRot = Math.atan2(20, 50);
      expect(container.rotation).toBe(oldAngle + newRot, 'Wrong new rotation');
    });

    it('should not do anything if container is not handling', () => {
      let called = false;
      container.endHandling = function() { called = true; };
      rotate.mousemove(<any>{ });
      expect(called).toBe(false, 'Still called');
    });

    it('should not do anything if container is handled by someone else', () => {
      container.beginHandling({ })
      let called = false;
      container.endHandling = function() { called = true; };
      rotate.mousemove(<any>{ });
      expect(called).toBe(false, 'Still called');
    });
  });

  describe('attached', () => {
    it('should add all areas to the stage', () => {
      rotate.attached(service.stage);
      rotate.areas.forEach((area, i) => {
        expect(service.stage.children.indexOf(area)).toBeGreaterThanOrEqual(0, `Area index ${i} missing in stage`);
      });
    });
  });

  describe('detached', () => {
    it('should remove all areas from the stage', () => {
      rotate.detached(service.stage);
      rotate.areas.forEach((area, i) => {
        expect(service.stage.children.indexOf(area)).toBeLessThan(0, `Area index ${i} still in stage`);
      });
    });
  });

  describe('updated', () => {
    it('should call updateAreaPostions', () => {
      let called = false;
      rotate.updateAreaPostions = function() { called = true; };
      rotate.updated(service.stage);
      expect(called).toBe(true, 'Not called');
    });
  });

  describe('selected', () => {
    it('should apply the rotation of the selected entity and emit "update" if only one selected', () => {
      const entity = new SpriteEntity();
      container.select([entity]);
      entity.rotation = Math.PI;
      let emitted = false;
      container.on('update', () => emitted = true);
      rotate.selected();
      expect(container.rotation).toBe(Math.PI, 'Rotation not applied');
      expect(entity.rotation).toBe(0, 'Entity rotation not reset');
      expect(emitted).toBe(true, 'Not emitted');
    });
  });

  describe('unselected', () => {
    it('should apply the rotation of the container back to all entities and reset the rotation back to 0', () => {
      const entities = [];
      for (let i = 0; i < 10; i++) {
        const entity = new SpriteEntity();
        (<any>entity)._prev_rot = entity.rotation = Math.random() * Math.PI * 2;
        entities.push(entity);
      }
      container.select(entities);
      container.rotation = Math.PI * 1.5;
      rotate.unselected(entities);
      entities.forEach((entity, i) => {
        expect(entity.rotation).toBe((<any>entity)._prev_rot + Math.PI * 1.5, `Wrong rotation for entity ${i}`);
      });
      expect(container.rotation).toBe(0, 'Container rotation not reset');
    });
  });

  describe('updateAreaPostions', () => {

    it('should align the control areas at the correct positions with an offset if one entity is selected', () => {
      container.select([new SpriteEntity()]);
      const bnds = new Rectangle(0, 0, 500, 500);
      container.getLocalBounds = function() { return bnds; };
      rotate.updateAreaPostions(service.stage);
      const offset = 15;
      const threshold = 50;
      // Top
      expect(rotate.areas[0].position.x).toBe(bnds.x, 'Wrong x position for top area');
      expect(rotate.areas[0].position.y).toBe(bnds.y, 'Wrong y position for top area');
      expect((<Rectangle>rotate.areas[0].hitArea).x).toBe(-offset - threshold, 'Wrong x position for top area');
      expect((<Rectangle>rotate.areas[0].hitArea).y).toBe(-offset - threshold, 'Wrong y position for top area');
      expect((<Rectangle>rotate.areas[0].hitArea).width).toBe(bnds.width + (offset + threshold) * 2, 'Wrong width for top area');
      expect((<Rectangle>rotate.areas[0].hitArea).height).toBe(threshold, 'Wrong height for top area');

      // Right
      expect(rotate.areas[1].position.x).toBe(bnds.x + bnds.width, 'Wrong x position for right area');
      expect(rotate.areas[1].position.y).toBe(bnds.y, 'Wrong y position for right area');
      expect((<Rectangle>rotate.areas[1].hitArea).x).toBe(offset, 'Wrong x position for right area');
      expect((<Rectangle>rotate.areas[1].hitArea).y).toBe(0, 'Wrong y position for right area');
      expect((<Rectangle>rotate.areas[1].hitArea).width).toBe(threshold, 'Wrong width for right area');
      expect((<Rectangle>rotate.areas[1].hitArea).height).toBe(bnds.height, 'Wrong height for right area');

      // Bottom
      expect(rotate.areas[2].position.x).toBe(bnds.x, 'Wrong x position for bottom area');
      expect(rotate.areas[2].position.y).toBe(bnds.y + bnds.height, 'Wrong y position for bottom area');
      expect((<Rectangle>rotate.areas[2].hitArea).x).toBe(-offset - threshold, 'Wrong x position for bottom area');
      expect((<Rectangle>rotate.areas[2].hitArea).y).toBe(offset, 'Wrong y position for bottom area');
      expect((<Rectangle>rotate.areas[2].hitArea).width).toBe(bnds.width + (offset + threshold) * 2, 'Wrong width for bottom area');
      expect((<Rectangle>rotate.areas[2].hitArea).height).toBe(threshold, 'Wrong height for bottom area');

      // Left
      expect(rotate.areas[3].position.x).toBe(bnds.x, 'Wrong x position for left area');
      expect(rotate.areas[3].position.y).toBe(bnds.y, 'Wrong y position for left area');
      expect((<Rectangle>rotate.areas[3].hitArea).x).toBe(-offset - threshold, 'Wrong x position for left area');
      expect((<Rectangle>rotate.areas[3].hitArea).y).toBe(0, 'Wrong y position for left area');
      expect((<Rectangle>rotate.areas[3].hitArea).width).toBe(threshold, 'Wrong width for left area');
      expect((<Rectangle>rotate.areas[3].hitArea).height).toBe(bnds.height, 'Wrong height for left area');
    });

  });

});
