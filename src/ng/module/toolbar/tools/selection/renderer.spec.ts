import { SelectionRenderer } from "./renderer";
import { PixiService, SpriteEntity } from "ng/module/pixi/idx";
import { SelectionContainer } from "./container";
import { Graphics, Rectangle, Point } from "pixi.js";

describe('SelectionRenderer', () => {

  let renderer: SelectionRenderer;
  let service: PixiService;

  beforeAll(() => {
    service = new PixiService();
    service.setUp({ nativeElement: document.createElement('canvas') }, { });
  });

  beforeEach(() => {
    renderer = new SelectionRenderer(service, new SelectionContainer());
    service.scene.addChild(renderer.selectionContainer);
  });

  describe('initial', () => {
    it('should listen to camera updates in the scene', () => {
      const functions = service.scene.listeners('camera:update');
      const found = functions.find(fn => fn.name === 'update');
      expect(found).toBeDefined('No handler found with name "update"');
    });

    it('should listen to "selected" "update" and "unselected" events on the container', () => {
      const selected = renderer.selectionContainer.listeners('selected');
      const update = renderer.selectionContainer.listeners('update');
      const unselected = renderer.selectionContainer.listeners('unselected');
      expect(selected.find(fn => fn.name === 'attach')).toBeDefined('No handler found with name "attach"');
      expect(update.find(fn => fn.name === 'update')).toBeDefined('No handler found with name "update"');
      expect(unselected.find(fn => fn.name === 'detach')).toBeDefined('No handler found with name "detach"');
    });
  });

  describe('selectionContainer', () => {
    it('should remove all handlers from the old container and add them to the new one', () => {
      const old = renderer.selectionContainer;
      renderer.selectionContainer = new SelectionContainer();
      let selected = old.listeners('selected');
      let update = old.listeners('update');
      let unselected = old.listeners('unselected');
      expect(selected.find(fn => fn.name === 'attach')).toBeUndefined('Handler found with name "attach" in old ref');
      expect(update.find(fn => fn.name === 'update')).toBeUndefined('Handler found with name "update" in old ref');
      expect(unselected.find(fn => fn.name === 'detach')).toBeUndefined('Handler found with name "detach" in old ref');
      selected = renderer.selectionContainer.listeners('selected');
      update = renderer.selectionContainer.listeners('update');
      unselected = renderer.selectionContainer.listeners('unselected');
      expect(selected.find(fn => fn.name === 'attach')).toBeDefined('No handler found with name "attach"');
      expect(update.find(fn => fn.name === 'update')).toBeDefined('No handler found with name "update"');
      expect(unselected.find(fn => fn.name === 'detach')).toBeDefined('No handler found with name "detach"');
    });

    it('should force a detach from old container, if attached', () => {
      renderer.selectionContainer.select([new SpriteEntity()]);
      let called = false;
      (<any>renderer).detach = function(force) { called = force; };
      renderer.selectionContainer = new SelectionContainer();
      expect(called).toBe(true, 'Not detached');
    });

    it('should emit the "change:selectionContainer" event on change', () => {
      let emitted = false;
      renderer.on('change:selectionContainer', () => emitted = true);
      renderer.selectionContainer = new SelectionContainer();
      expect(emitted).toBe(true, 'Not triggered');
    });

    it('should not emit the "change:selectionContainer" event if not changed', () => {
      let emitted = false;
      const old = renderer.selectionContainer;
      renderer.on('change:selectionContainer', () => emitted = true);
      renderer.selectionContainer = old;
      expect(emitted).toBe(false, 'Still triggered');
    });
  });

  describe('attach', () => {
    it('should add itself to the stage, emit the "attached" event and update if entities got selected', () => {
      let called = false;
      let emitted = false;
      (<any>renderer).update = function() { called = true; };
      renderer.on('attached', () => emitted = true );
      renderer.selectionContainer.select([new SpriteEntity(), new SpriteEntity(), new SpriteEntity()]);
      expect(called).toBe(true, 'Update not called');
      expect(emitted).toBe(true, 'Not emitted');
      expect(renderer.isAttached).toBe(true, 'Attached flag not updated');
      expect(service.stage.children.find(entity => entity === renderer)).toBe(renderer, 'Not added');
    });

    it('should not attach a second time', () => {
      renderer.selectionContainer.select([new SpriteEntity(), new SpriteEntity(), new SpriteEntity()]);
      renderer.selectionContainer.select([new SpriteEntity(), new SpriteEntity(), new SpriteEntity()]);
      let emitted = false;
      renderer.on('attached', () => emitted = true );
      expect(emitted).toBe(false, 'Still emitted');
    });

    it('should not attach if zero selections happened', () => {
      renderer.selectionContainer.select([]);
      expect(renderer.isAttached).toBe(false, 'Still attached');
    });
  });

  describe('detach', () => {
    it('should remove itself from the stage, emit the "detached" event and clear if all entities got unselected', () => {
      let emitted = false;
      renderer.on('detached', () => emitted = true );
      renderer.selectionContainer.select([new SpriteEntity(), new SpriteEntity(), new SpriteEntity()]);
      renderer.selectionContainer.unselect();
      expect(emitted).toBe(true, 'Not emitted');
      expect(renderer.isAttached).toBe(false, 'Attached flag not updated');
      expect(service.stage.children.find(entity => entity === renderer)).toBeUndefined('Not removed');
    });

    it('should not detach if the selection container has still entities', () => {
      renderer.selectionContainer.select([new SpriteEntity(), new SpriteEntity()]);
      let emitted = false;
      let called = false;
      (<any>renderer).update = function() { called = true; };
      renderer.on('detached', () => emitted = true );
      renderer.selectionContainer.unselect(renderer.selectionContainer.entities.slice(1));
      expect(emitted).toBe(false, 'Still emitted');
      expect(called).toBe(true, 'Update not called');
      expect(renderer.isAttached).toBe(true, 'Attached flag not updated');
    });

    it('should not detach if not attached', () => {
      let emitted = false;
      renderer.selectionContainer.unselect();
      renderer.on('detached', () => emitted = true );
      expect(emitted).toBe(false, 'Still emitted');
    });
  });

  describe('update', () => {
    let shapes, beginFill, endFill,
        lineStyle, lineWidth, lineColor, lineAlpha,
        fillColor, fillAlpha;

    beforeEach(() => {
      shapes = 0;
      beginFill = false;
      endFill = false;
      lineStyle = false;
      lineWidth = void 0;
      lineColor = void 0;
      lineAlpha = void 0;
      fillColor = void 0;
      fillAlpha = void 0;
      renderer.drawShape = function() { shapes++; return Graphics.prototype.drawShape.apply(this, arguments); };
      renderer.beginFill = function(color, alpha) {
        fillColor = color;
        fillAlpha = alpha;
        endFill = true;
        beginFill = true;
        return Graphics.prototype.beginFill.apply(this, arguments);
      };
      renderer.endFill = function() { endFill = true; return Graphics.prototype.endFill.apply(this, arguments); };
      renderer.lineStyle = function(width, color, alpha) {
        lineWidth = width;
        lineColor = color;
        lineAlpha = alpha;
        lineStyle = true;
        return Graphics.prototype.lineStyle.apply(this, arguments);
      };
    });

    it('should draw the shape and bounds off all entites and not fill if is attached, by default, if only one selected', () => {
      renderer.selectionContainer.select([new SpriteEntity()]);
      shapes = 0;
      let bounds = 0;
      const oldBounds = SelectionRenderer.drawBounds;
      SelectionRenderer.drawBounds = function() { bounds++; }
      let emitted = false;
      renderer.on('updated', () => emitted = true);
      renderer.selectionContainer.emit('update');
      expect(shapes).toBe(1, 'drawShape not called once');
      expect(bounds).toBe(1, 'drawBounds not drawn');
      expect(lineStyle).toBe(true, 'lineStyle not called');
      expect(beginFill).toBe(false, 'beginFill called');
      expect(endFill).toBe(false, 'endFill called');
      expect(emitted).toBe(true, 'Not emitted');
      SelectionRenderer.drawBounds = oldBounds;
    });

    it('should draw two shapes and bounds and not fill if is attached, by default, if multiple selected', () => {
      renderer.selectionContainer.select([new SpriteEntity(), new SpriteEntity(), new SpriteEntity()]);
      shapes = 0;
      let bounds = 0;
      const oldBounds = SelectionRenderer.drawBounds;
      SelectionRenderer.drawBounds = function() { bounds++; }
      let emitted = false;
      renderer.on('updated', () => emitted = true);
      renderer.selectionContainer.emit('update');
      expect(shapes).toBe(2, 'drawShape not called twice');
      expect(bounds).toBe(1 + renderer.selectionContainer.length, 'drawBounds not drawn twice');
      expect(lineStyle).toBe(true, 'lineStyle not called');
      expect(beginFill).toBe(false, 'beginFill called');
      expect(endFill).toBe(false, 'endFill called');
      expect(emitted).toBe(true, 'Not emitted');
      SelectionRenderer.drawBounds = oldBounds;
    });

    it('should apply default line style, by default', () => {
      renderer.selectionContainer.select([new SpriteEntity()]);
      renderer.selectionContainer.emit('update');
      expect(lineWidth).toBe(1, 'Wrong lineWidth');
      expect(lineColor).toBe(0xffffff, 'Wrong lineColor');
      expect(lineAlpha).toBe(1, 'Wrong lineAlpha');
    });

    it('should apply default fill color if alpha is bigger than 0', () => {
      renderer.selectionContainer.select([new SpriteEntity()]);
      renderer.config.fill.alpha = 0.5;
      renderer.selectionContainer.emit('update');
      expect(beginFill).toBe(true, 'beginFill not called');
      expect(endFill).toBe(true, 'endFill not called');
      expect(fillAlpha).toBe(0.5, 'Wrong fillAlpha');
      expect(fillColor).toBe(0xffffff, 'Wrong fillColor');
    });

    it('should apply configured line style and fill if configured', () => {
      renderer.selectionContainer.select([new SpriteEntity()]);
      renderer.config.line.alpha = 0.5;
      renderer.config.line.color = 0x00ff00;
      renderer.config.line.width = 2;
      renderer.config.fill.alpha = 1;
      renderer.config.fill.color = 0xff00ff;
      renderer.selectionContainer.emit('update');
      expect(lineStyle).toBe(true, 'lineStyle not called');
      expect(lineWidth).toBe(renderer.config.line.width, 'Wrong lineWidth');
      expect(lineAlpha).toBe(renderer.config.line.alpha, 'Wrong lineAlpha');
      expect(lineColor).toBe(renderer.config.line.color, 'Wrong lineColor');
      expect(beginFill).toBe(true, 'beginFill not called');
      expect(endFill).toBe(true, 'endFill not called');
      expect(fillAlpha).toBe(renderer.config.fill.alpha, 'Wrong fillAlpha');
      expect(fillColor).toBe(renderer.config.fill.color, 'Wrong fillColor');
    });

    it('should do nothing if not attached', () => {
      let emitted = false;
      renderer.on('updated', () => emitted = true);
      renderer.selectionContainer.emit('update');
      expect(emitted).toBe(false, 'Still emitted');
    });
  });

  describe('drawBounds', () => {
    const lineTo: Point[] = [];
    const moveTo = new Point();

    beforeEach(() => {
      lineTo.length = 0;
      renderer.lineTo = function(x,y)
        {
        lineTo.push(new Point(x, y));
        return Graphics.prototype.lineTo.apply(this, arguments);
        };
      renderer.moveTo = function(x, y)
        {
        moveTo.set(x,y);
        return Graphics.prototype.moveTo.apply(this, arguments);
        }
    });

    it('should move to the first point in the point list and draw a line to the next point', () => {
      const points = [new Point(0, 0), new Point(50, 150), new Point(100, 0),
                      new Point(100, 100), new Point(50, 150), new Point(0, 100)];
      SelectionRenderer.drawBounds(renderer, void 0, points.slice());
      expect(moveTo.x).toBe(points[0].x, 'Wrong x value for starting point');
      expect(moveTo.y).toBe(points[0].y, 'Wrong y value for starting point');
      expect(lineTo.length).toBe(points.length, 'Wrong amount of lines drawn');
      points.forEach((point, i) => {
        expect(lineTo[(points.length + (i - 1)) % points.length].x).toBe(point.x, `Wrong x value at index ${i}`);
        expect(lineTo[(points.length + (i - 1)) % points.length].y).toBe(point.y, `Wrong y value at index ${i}`);
      });
    });

    it('should map all corners of the entity to the target space and render lines between them', () => {
      const entity = new SpriteEntity();
      const x = Math.round(Math.random() * 1000);
      const y = Math.round(Math.random() * 1000);
      const width = Math.round(Math.random() * 1000);
      const height = Math.round(Math.random() * 1000);
      const bnds = new Rectangle(x, y, width, height);
      entity.getLocalBounds = function() { return bnds; };
      service.scene.addChild(entity);
      service.stage.addChild(renderer);
      const old = service.stage.toLocal;
      const calls: Point[] = [];
      service.stage.toLocal = function(point) { calls.push(new Point(point.x, point.y)); return old.apply(this, arguments) };
      SelectionRenderer.drawBounds(renderer, entity);
      expect(calls.length).toBe(4);
      expect(calls[0].x).toBe(x, 'Wrong x value for top left');
      expect(calls[0].y).toBe(y, 'Wrong y value for top left');

      expect(calls[1].x).toBe(x + width, 'Wrong x value for top right');
      expect(calls[1].y).toBe(y, 'Wrong y value for top rightt');

      expect(calls[2].x).toBe(x + width, 'Wrong x value for bottom right');
      expect(calls[2].y).toBe(y + height, 'Wrong y value for bottom right');

      expect(calls[3].x).toBe(x, 'Wrong x value for bottom left');
      expect(calls[3].y).toBe(y + height, 'Wrong y value for bottom left');
      service.stage.toLocal = old;
    });

  });

});
