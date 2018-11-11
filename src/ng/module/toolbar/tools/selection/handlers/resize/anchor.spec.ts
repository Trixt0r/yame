import { ResizeAnchor, HOR, VERT, LEFT, UP, RIGHT, DOWN } from "./anchor";
import { PixiService } from "ng/idx";
import { Graphics, Rectangle, Container, Point } from "pixi.js";
import { SelectionContainer } from "../../container";

describe('ResizeAnchor', () => {
  let service: PixiService;
  let anchor: ResizeAnchor;

  beforeEach(() => {
    service = new PixiService();
    service.setUp({ nativeElement: document.createElement('canvas') }, { });
    anchor = new ResizeAnchor(LEFT, service);
  });

  describe('initial', () => {
    it('should listen to mouse* events on the anchor and be interactive and offset should be in center', () => {
      const mousedown = anchor.listeners('mousedown');
      const mousemove = anchor.listeners('mousemove');
      const mouseover = anchor.listeners('mouseover');
      const mouseout = anchor.listeners('mouseout');
      expect(mousedown.find(fn => fn === anchor.mousedown)).toBe(anchor.mousedown, 'mousedown not registered');
      expect(mousemove.find(fn => fn === anchor.mousemove)).toBe(anchor.mousemove, 'mousemvoe not registered');
      expect(mouseover.find(fn => fn === anchor.updateCursor)).toBe(anchor.updateCursor, 'mouseover not registered');
      expect(mouseout.find(fn => fn === anchor.resetCursor)).toBe(anchor.resetCursor, 'mouseout not registered');
      expect(anchor.interactive).toBe(true, 'Not interactive');
      expect(anchor.offset.x).toBe(0.5, 'Wrong x offset');
      expect(anchor.offset.y).toBe(0.5, 'Wrong y offset');
    });

    it('should not allow RIGHT and LEFT at the same time', () => {
      try {
        new ResizeAnchor(LEFT | RIGHT, service);
      } catch (e) {
        expect(e.message).toBe('LEFT and RIGHT can not be set at the same time');
      }
    });

    it('should not allow UP and DOWN at the same time', () => {
      try {
        new ResizeAnchor(UP | DOWN, service);
      } catch (e) {
        expect(e.message).toBe('DOWN and UP can not be set at the same time');
      }
    });
  });

  describe('setUpOffset', () => {
    it('should set offset to (0.5, 0.5) if not HOR and not VERT', () => {
      anchor.type = UP;
      anchor.setUpOffset();
      expect(anchor.offset.x).toBe(0.5, 'Wrong x offset');
      expect(anchor.offset.y).toBe(0.5, 'Wrong y offset');
    });

    it('should set x offset to 1 if HOR and RIGHT', () => {
      anchor.type = HOR | RIGHT;
      anchor.setUpOffset();
      expect(anchor.offset.x).toBe(1, 'Wrong x offset');
    });

    it('should set x offset to 1 if HOR and LEFT', () => {
      anchor.type = HOR | LEFT;
      anchor.setUpOffset();
      expect(anchor.offset.x).toBe(0, 'Wrong x offset');
    });

    it('should set y offset to 1 if VERT and DOWN', () => {
      anchor.type = VERT | DOWN;
      anchor.setUpOffset();
      expect(anchor.offset.y).toBe(1, 'Wrong y offset');
    });

    it('should set y offset to 1 if VERT and UP', () => {
      anchor.type = VERT | UP;
      anchor.setUpOffset();
      expect(anchor.offset.y).toBe(0, 'Wrong y offset');
    });
  });

  describe('matches', () => {
    it('should return true if one given type matches', () => {
      anchor.type = HOR | LEFT | UP;
      expect(anchor.matches(HOR)).toBe(true);
      expect(anchor.matches(LEFT)).toBe(true);
      expect(anchor.matches(UP)).toBe(true);
      anchor.type = VERT | RIGHT | DOWN;
      expect(anchor.matches(VERT)).toBe(true);
      expect(anchor.matches(RIGHT)).toBe(true);
      expect(anchor.matches(DOWN)).toBe(true);
    });

    it('should return false if no type matches', () => {
      anchor.type = HOR | LEFT | UP;
      expect(anchor.matches(VERT)).toBe(false);
      expect(anchor.matches(RIGHT)).toBe(false);
      expect(anchor.matches(DOWN)).toBe(false);
      anchor.type = VERT | RIGHT | DOWN;
      expect(anchor.matches(HOR)).toBe(false);
      expect(anchor.matches(LEFT)).toBe(false);
      expect(anchor.matches(UP)).toBe(false);
    });
  });

  describe('render', () => {
    let rect, beginFill, endFill, clear,
        lineStyle, lineWidth, lineColor, lineAlpha,
        fillColor, fillAlpha, bounds;

    beforeEach(() => {
      rect = null;
      beginFill = false;
      endFill = false;
      clear = false;
      bounds = new Rectangle(0, 0, anchor.config.size, anchor.config.size);
      lineStyle = false;
      lineWidth = void 0;
      lineColor = void 0;
      lineAlpha = void 0;
      fillColor = void 0;
      fillAlpha = void 0;
      anchor.drawRect = function(x, y, width, height) {
        rect = {x: x, y: y, width: width, height: height};
      return Graphics.prototype.drawShape.apply(this, arguments);
    };
      anchor.beginFill = function(color, alpha) {
        fillColor = color;
        fillAlpha = alpha;
        endFill = true;
        beginFill = true;
        return Graphics.prototype.beginFill.apply(this, arguments);
      };
      anchor.endFill = function() { endFill = true; return Graphics.prototype.endFill.apply(this, arguments); };
      anchor.clear = function() { clear = true; return Graphics.prototype.clear.apply(this, arguments); };
      anchor.lineStyle = function(width, color, alpha) {
        lineWidth = width;
        lineColor = color;
        lineAlpha = alpha;
        lineStyle = true;
        return Graphics.prototype.lineStyle.apply(this, arguments);
      };
      service.stage.addChild(anchor);
      anchor.getLocalBounds = function() { return bounds; };
    });

    it('should apply default line style and fill and set the hitArea slightly bigger than the local bounds, by default', () => {
      anchor.render();
      expect(lineWidth).toBe(1, 'Wrong default lineWidth');
      expect(lineColor).toBe(0xffffff, 'Wrong default lineColor');
      expect(lineAlpha).toBe(1, 'Wrong default lineAlpha');
      expect(beginFill).toBe(true, 'beginFill called');
      expect(endFill).toBe(true, 'endFill called');
      expect(fillAlpha).toBe(1, 'Wrong fillpha');
      expect(fillColor).toBe(0x000000, 'Wrong fillColor');
      expect(rect).toBeDefined('No rectangle drawn');
      expect(rect.x).toBe(-anchor.config.size / 2, 'Wrong x position for rect');
      expect(rect.y).toBe(-anchor.config.size / 2, 'Wrong y position for rect');
      expect(rect.width).toBe(anchor.config.size, 'Wrong width for rect');
      expect(rect.height).toBe(anchor.config.size, 'Wrong height for rect');
      expect((<Rectangle>anchor.hitArea).x).toBe(bounds.x - 5, 'Wrong x position for hitArea');
      expect((<Rectangle>anchor.hitArea).x).toBe(bounds.y - 5, 'Wrong y position for hitArea');
      expect((<Rectangle>anchor.hitArea).width).toBe(bounds.width + 10, 'Wrong width for hitArea');
      expect((<Rectangle>anchor.hitArea).height).toBe(bounds.height + 10, 'Wrong height for hitArea');
    });

    it('should not fill if alpha is less than 0', () => {
      anchor.config.fill.alpha = 0;
      anchor.render();
      expect(beginFill).toBe(false, 'beginFill not called');
      expect(endFill).toBe(false, 'endFill not called');
    });

    it('should apply configured line style and fill if configured', () => {
      anchor.config.line.alpha = 0.5;
      anchor.config.line.color = 0x00ff00;
      anchor.config.line.width = 2;
      anchor.config.fill.alpha = 1;
      anchor.config.fill.color = 0xff00ff;
      anchor.render();
      expect(lineStyle).toBe(true, 'lineStyle not called');
      expect(lineWidth).toBe(anchor.config.line.width, 'Wrong lineWidth');
      expect(lineAlpha).toBe(anchor.config.line.alpha, 'Wrong lineAlpha');
      expect(lineColor).toBe(anchor.config.line.color, 'Wrong lineColor');
      expect(beginFill).toBe(true, 'beginFill not called');
      expect(endFill).toBe(true, 'endFill not called');
      expect(fillAlpha).toBe(anchor.config.fill.alpha, 'Wrong lineWidth');
      expect(fillColor).toBe(anchor.config.fill.color, 'Wrong lineColor');
    });
  });

  describe('updateCursor', () => {
    it('should set cursor to ns-resize if only vertical', () => {
      new ResizeAnchor(VERT, service).updateCursor(<any>{ });
      expect(service.view.style.cursor).toBe('ns-resize');
    });

    it('should set cursor to ew-resize if only horizontal', () => {
      new ResizeAnchor(HOR, service).updateCursor(<any>{ });
      expect(service.view.style.cursor).toBe('ew-resize');
    });

    it('should set cursor to nesw-resize if top right or bottom left', () => {
      new ResizeAnchor(UP | RIGHT | HOR | VERT, service).updateCursor(<any>{ });
      expect(service.view.style.cursor).toBe('nesw-resize');
      new ResizeAnchor(DOWN | LEFT | HOR | VERT, service).updateCursor(<any>{ });
      expect(service.view.style.cursor).toBe('nesw-resize');
    });

    it('should set cursor to nwse-resize if top left or bottom right', () => {
      new ResizeAnchor(UP | LEFT | HOR | VERT, service).updateCursor(<any>{ });
      expect(service.view.style.cursor).toBe('nwse-resize');
      new ResizeAnchor(DOWN | RIGHT | HOR | VERT, service).updateCursor(<any>{ });
      expect(service.view.style.cursor).toBe('nwse-resize');
    });

    it('should change cursor based on rotation', () => {
      const newAnchor = new ResizeAnchor(UP | LEFT | HOR | VERT, service);
      // 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
      const angles = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75,
                      Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75 ];
      const cursors = ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize',
                        'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'];
      angles.forEach((angle, i) => {
        newAnchor.rotation = angle;
        newAnchor.updateCursor(<any>{ });
        expect(service.view.style.cursor).toBe(cursors[i], `Wrong cursor at angle ${angle}, ${i}`);
      })
    });
  });

  describe('resetCursor', () => {
    it('should not reset cursor if not left', () => {
      const newAnchor = new ResizeAnchor(UP | LEFT | HOR | VERT, service);
      newAnchor.updateCursor(<any>{ });
      newAnchor.resetCursor();
      expect(service.view.style.cursor).not.toBe('', 'Cursor still reset');
    });

    it('should reset if mouse left', () => {
      const newAnchor = new ResizeAnchor(UP | LEFT | HOR | VERT, service);
      newAnchor.updateCursor(<any>{ });
      newAnchor.resetCursor(<any>{ });
      expect(service.view.style.cursor).toBe('', 'Cursor not reset');
    });
  });

  describe('validate', () => {
    it('should throw an error if no target set', () => {
      anchor.target = null;
      expect(anchor.validate.bind(anchor)).toThrowError('No target specified');
    });

    it('should throw an error if no container set', () => {
      anchor.target = new Container();
      anchor.container = null;
      expect(anchor.validate.bind(anchor)).toThrowError('You have to define a selection container in order to be able to resize the target');
    });

    it('should return true if container and target are set', () => {
      anchor.target = new Container();
      anchor.container = new SelectionContainer();
      expect(anchor.validate()).toBe(true);
    });
  });

  describe('mousedown', () => {
    beforeEach(() => {
      anchor.target = new Container();
      anchor.container = new SelectionContainer();
      service.scene.addChild(anchor.container);
    });

    it('should validate and emit the "handle:start" event', () => {
      let called = false;
      let emitted = false;
      anchor.validate = function() { called = true; return true; };
      anchor.on('handle:start', () => emitted = true );
      anchor.mousedown(<any>{
        stopped: false,
        currentTarget: anchor,
        data: { global: new Point(0, 0) },
      });
      expect(called).toBe(true, 'Not validated');
      expect(emitted).toBe(true, 'Not emitted');
    });

    it('should do nothing if already clicked', () => {
      anchor.target = new Container();
      anchor.container = new SelectionContainer();
      service.scene.addChild(anchor.container);
      anchor.mousedown(<any>{
        stopped: false,
        currentTarget: anchor,
        data: { global: new Point(0, 0) },
      });
      let emitted = false;
      anchor.on('handle:start', () => emitted = true );
      anchor.mousedown(<any>{
        stopped: false,
        currentTarget: anchor,
        data: { global: new Point(0, 0) },
      });
      expect(emitted).toBe(false, 'Still emitted');
    });
  });

  describe('mouseup', () => {
    beforeEach(() => {
      anchor.target = new Container();
      anchor.container = new SelectionContainer();
      service.scene.addChild(anchor.container);
    });

    it('should emit handle:end and resetCursor if was clicked before', () => {
      anchor.mousedown(<any>{
        stopped: false,
        currentTarget: anchor,
        data: { global: new Point(0, 0) },
      });
      let emitted = false;
      let called = false
      anchor.resetCursor = function() { called = true; };
      anchor.on('handle:end', () => emitted = true );
      anchor.updateCursor(<any>{ });
      anchor.mouseup(<any>{ });
      expect(emitted).toBe(true, 'Not emitted');
      expect(called).toBe(true, 'Cursor not reset');
    });

    it('should not do anything if not clicked before', () => {
      let emitted = false;
      anchor.on('handle:end', () => emitted = true );
      anchor.mouseup(<any>{ });
      expect(emitted).toBe(false, 'Still emitted');
    });

    it('should be triggered via window.mouseup', () => {
      anchor.mousedown(<any>{
        stopped: false,
        currentTarget: anchor,
        data: { global: new Point(0, 0) },
      });
      let emitted = false;
      anchor.on('handle:end', () => emitted = true );
      const event = new MouseEvent('mouseup');
      window.dispatchEvent(event);
      expect(emitted).toBe(true, 'Not triggered');
    });
  });

  describe('mousemove', () => {
    const bounds = new Rectangle(0, 0, 500, 500);
    let target: Container;
    let container: SelectionContainer;
    beforeEach(() => {
      target = new Container();
      target.getLocalBounds = function() { return bounds; };
      container = new SelectionContainer();
      service.scene.addChild(container);
    });

    it('should scale in each direction the target by the moved distance and emit "update" event, if clicked', () => {
      const newAnchor = new ResizeAnchor(HOR | VERT | RIGHT | DOWN, service);
      newAnchor.target = target;
      newAnchor.container = container;
      const oldScale = new Point(newAnchor.target.scale.x, newAnchor.target.scale.y);
      newAnchor.mousedown(<any>{
        stopped: false,
        currentTarget: newAnchor,
        data: { global: new Point(0, 0) },
      });
      let emitted = false;
      let called = false;
      newAnchor.on('update', () => emitted = true);
      newAnchor.validate = function() { called = true; return true; };
      newAnchor.mousemove(<any>{
        stopped: false,
        currentTarget: newAnchor,
        data: { global: new Point(100, 300) },
      });
      expect(called).toBe(true, 'Not validated');
      expect(emitted).toBe(true, 'Not triggered');
      // 100 / 500
      expect(newAnchor.target.scale.x).toBe(oldScale.x + 0.2, 'Wrong new x scale');
      // 300 / 500
      expect(newAnchor.target.scale.y).toBe(oldScale.y + 0.6, 'Wrong new y scale');
    });

    it('should scale in x direction the target by the moved distance and emit "update" event, if clicked and only HOR', () => {
      const newAnchor = new ResizeAnchor(HOR | RIGHT, service);
      newAnchor.target = target;
      newAnchor.container = container;
      const oldScale = new Point(newAnchor.target.scale.x, newAnchor.target.scale.y);
      newAnchor.mousedown(<any>{
        stopped: false,
        currentTarget: newAnchor,
        data: { global: new Point(0, 0) },
      });
      let emitted = false;
      let called = false;
      newAnchor.on('update', () => emitted = true);
      newAnchor.validate = function() { called = true; return true; };
      newAnchor.mousemove(<any>{
        stopped: false,
        currentTarget: newAnchor,
        data: { global: new Point(-100, 300) },
      });
      expect(called).toBe(true, 'Not validated');
      expect(emitted).toBe(true, 'Not triggered');
      // -100 / 500
      expect(newAnchor.target.scale.x).toBe(oldScale.x - 0.2, 'Wrong new x scale');
      expect(newAnchor.target.scale.y).toBe(oldScale.y, 'Wrong new y scale');
    });

    it('should scale in y direction the target by the moved distance and emit "update" event, if clicked and only VERT', () => {
      const newAnchor = new ResizeAnchor(VERT | DOWN, service);
      newAnchor.target = target;
      newAnchor.container = container;
      const oldScale = new Point(newAnchor.target.scale.x, newAnchor.target.scale.y);
      newAnchor.mousedown(<any>{
        stopped: false,
        currentTarget: newAnchor,
        data: { global: new Point(0, 0) },
      });
      let emitted = false;
      let called = false;
      newAnchor.on('update', () => emitted = true);
      newAnchor.validate = function() { called = true; return true; };
      newAnchor.mousemove(<any>{
        stopped: false,
        currentTarget: newAnchor,
        data: { global: new Point(100, -300) },
      });
      expect(called).toBe(true, 'Not validated');
      expect(emitted).toBe(true, 'Not triggered');
      expect(newAnchor.target.scale.x).toBe(oldScale.x, 'Wrong new x scale');
      // -300 / 500
      expect(newAnchor.target.scale.y).toBe(oldScale.y - 0.6, 'Wrong new y scale');
    });

    it('should not do anything if anchor is not clicked', () => {
      const newAnchor = new ResizeAnchor(HOR | VERT | RIGHT | DOWN, service);
      newAnchor.target = target;
      newAnchor.container = container;
      let emitted = false;
      newAnchor.on('update', () => emitted = true);
      newAnchor.mousemove(<any>{ });
      expect(emitted).toBe(false, 'Still emitted');
    });
  });

  describe('update', () => {
    it('should call validate, set the position based on the offset, apply the container rotation and map the position to the stage', () => {
      let called = false;
      const container = new SelectionContainer();
      container.rotation = Math.PI;
      anchor.target = new Container();
      anchor.container = container;
      service.scene.addChild(container);
      let local = false;
      service.stage.toLocal = function() { local = true; return new Point(); };
      anchor.validate = function() { return called = true; };
      const bnds = new Rectangle(0, 0, 500, 500);
      anchor.update(service.stage, bnds);
      expect(called).toBe(true, 'Not validated');
      expect(anchor.position.x).toBe(bnds.x + bnds.width * anchor.offset.x, 'Wrong x position');
      expect(anchor.position.y).toBe(bnds.y + bnds.height * anchor.offset.y, 'Wrong y position');
      expect(anchor.rotation).toBe(container.rotation);
      expect(local).toBe(true, 'Not mapped to stage');
    });
  });

});
