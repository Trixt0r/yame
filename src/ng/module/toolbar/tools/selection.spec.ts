import { SelectionTool } from "./selection";
import { Tool } from "../tool";
import { Pubsub } from "electron/idx";
import { PixiService, SpriteEntity } from "ng/module/pixi/idx";
import { SelectionRectangle } from "./selection/rectangle";
import { SelectionRenderer } from "./selection/renderer";
import { SelectionContainer } from "./selection/container";
import { DisplayObject, Graphics } from "pixi.js";
import { Rectangle } from "electron";
import { Store, NgxsModule } from "@ngxs/store";
import { TestBed } from "@angular/core/testing";
import { SelectionState } from "./selection/ngxs/state";

describe('SelectionTool', () => {

  let tool: SelectionTool;
  let pixiService: PixiService;
  let store: Store;
  const ngRef = { injector: { get: function(type) { return type === Store ? store : pixiService; } } };

  beforeAll(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([
        SelectionState
    ])],
    }).compileComponents();
    store = TestBed.get(Store);
  })

  beforeEach(() => {
    pixiService = new PixiService();
    pixiService.setUp(<any>{ nativeElement: document.createElement('canvas') }, { });
    tool = new SelectionTool('select');
  });

  describe('initial', () => {
    it('should be a tool', () => {
      expect(tool instanceof Tool).toBe(true, 'Is not a tool');
    });

    it('should have a selection container', () => {
      expect(tool.selectionContainer).toBeDefined('No selection container defined');
    });

    it('should setup all dependencies on pubsub ready', () => {
      expect(tool.selectionRectangle).toBeUndefined('Is already initialized');
      Pubsub.emit('ready', ngRef);
      expect(tool.selectionRectangle).toBeDefined('Has not been initialized');
    });
  });

  describe('setup without Pubsub.ready', () => {
    it('should throw an exception', () => {
      expect(tool.setup.bind(tool)).toThrowError('No pixi service defined. Pubsub event "ready" not triggered?');
    });
  });

  describe('setup with Pubsub.ready', () => {
    beforeEach(() => {
      Pubsub.emit('ready', ngRef);
      tool.setup();
    });

    it('should initialize a selection rectangle and a renderer', () => {
      expect(tool.selectionRectangle instanceof SelectionRectangle).toBe(true, 'Wrong type for selectionRectangle');
      expect(tool.selectionRenderer instanceof SelectionRenderer).toBe(true, 'Wrong type for selectionRenderer');
    });

    it('should have 3 container handlers', () => {
      expect(tool.handlers.length).toBe(3, 'Wrong amount of handlers');
    });

    it('should add the container to the stage', () => {
      expect(pixiService.scene.getChildIndex(tool.selectionContainer))
        .toBeGreaterThanOrEqual(0, 'Container is not part of the map');
    });

    it('should remove all container listeners on follow up calls', () => {
      let executed = false;
      tool.selectionContainer.removeAllListeners = function() { executed = true; return tool.selectionContainer; };
      tool.setup();
      expect(executed).toBe(true, 'removeAllListeners not executed');
    });

    it('should execute addToolListeners only if active', () => {
      let executed = false;
      tool.addToolListeners = function() { executed = true; };
      expect(executed).toBe(false, 'addToolListeners got executed');
      return tool.onActivate()
              .then(() => {
                tool.setup();
                expect(executed).toBe(true, 'addToolListeners not executed');
              });
    });
  });

  describe('onActivate', () => {
    let executed = false;
    beforeEach(() => {
      executed = false;
      tool.addToolListeners = function() { executed = true; };
    });

    it('should not execute addToolListeners if pixi service is not set', () => {
      return tool.onActivate()
              .then(() => expect(executed).toBe(false, 'addToolListeners has been executed'));
    });

    it('should execute addToolListeners pixi service is set', () => {
      Pubsub.emit('ready', ngRef);
      return tool.onActivate()
              .then(() => expect(executed).toBe(true, 'addToolListeners has been executed'));
    });
  });

  describe('onDeactivate', () => {
    let executed = false;
    beforeEach(() => {
      executed = false;
      tool.removeToolListeners = function() { executed = true; };
    });

    it('should execute removeToolListeners', () => {
      return tool.onDeactivate()
              .then(() => expect(executed).toBe(true, 'removeToolListeners has been executed'));
    });
  });

  describe('addToolListeners', () => {
    beforeEach(() => Pubsub.emit('ready', ngRef));

    it('should call initFunctions', () => {
      let executed = false;
      (<any>tool).initFunctions = function() { executed = true; };
      tool.addToolListeners();
      expect(executed).toBe(true, 'initFunctions not executed');
    });

    it('should call add mousedown, mouseup and mousemove handlers on the pixi canvas view', () => {
      const handlers: { [key: string]: any[] } = { };
      pixiService.view.addEventListener = function(name, fn) {
        if (!handlers[name]) handlers[name] = [];
        handlers[name].push(fn);
      };
      tool.addToolListeners();
      expect(handlers.mousedown.length).toBe(1, 'Wrong amount of handlers added to "mousedown"');
      expect(handlers.mouseup.length).toBe(1, 'Wrong amount of handlers added to "mouseup"');
      expect(handlers.mousemove.length).toBe(1, 'Wrong amount of handlers added to "mousemove"');
    });
  });

  describe('removeToolListeners', () => {
    beforeEach(() => Pubsub.emit('ready', ngRef));

    it('should remove mousedown, mouseup and mousemove handlers on the pixi canvas view', () => {
      const handlers: { [key: string]: any[] } = { };
      pixiService.view.removeEventListener = function(name, fn) {
        if (!handlers[name]) handlers[name] = [];
        handlers[name].push(fn);
      };
      tool.removeToolListeners();
      expect(handlers.mousedown.length).toBe(1, 'Wrong amount of handlers remove from "mousedown"');
      expect(handlers.mouseup.length).toBe(1, 'Wrong amount of handlers remove from "mouseup"');
      expect(handlers.mousemove.length).toBe(1, 'Wrong amount of handlers remove from "mousemove"');
    });
  });

  describe('mousedown', () => {

    let unselected = false;
    let updated = false;
    let reset = false;
    let removed: SelectionContainer = null;
    let finished = false;
    let cleared = false;

    beforeEach(() => {
      Pubsub.emit('ready', ngRef);
      tool.selectionContainer.unselect = function() { unselected = true; return []; };
      tool.selectionRectangle.reset = function() { reset = true; };
      tool.selectionRectangle.update = function() { updated = true; return tool.selectionRectangle.rectangle; };
      tool.finish = function() { finished = true; };
      tool.selectionGraphics.clear = function() { cleared = true; return tool.selectionGraphics; };
      pixiService.scene.removeChild = function(obj) { removed = <any>obj; return obj; };
    });

    it('should skip if container is handling', () => {
      tool.selectionContainer.beginHandling(this);
      const event = new MouseEvent('mousedown')
      tool.mousedown(event);
      expect(unselected).toBe(false, 'Still executed');
      tool.selectionContainer.endHandling(this);
    });

    it('should skip if right mouse button is not pressed', () => {
      const event = new MouseEvent('mousedown', { button: -1 });
      tool.mousedown(event);
      expect(unselected).toBe(false, 'Still executedd');
    });

    it('should not unselect if nothing selected', () => {
      const event = new MouseEvent('mousedown');
      tool.mousedown(event);
      expect(unselected).toBe(false, 'Still executed');
    });

    it('should not unselect if something selected', () => {
      const event = new MouseEvent('mousedown');
      tool.mousedown(event);
      expect(unselected).toBe(false, 'Still executed');
    });

    it('should skip if second mousedown got executed', () => {
      const event = new MouseEvent('mousedown');
      tool.selectionContainer.select([new SpriteEntity()]);
      tool.mousedown(event);
      expect(unselected).toBe(true, 'First time not executed');
      unselected = false;
      tool.mousedown(event);
      expect(unselected).toBe(false, 'Still executed');
    });

    it('should unselect, remove the container and update the selection retangle if previous checks are ok', () => {
      const event = new MouseEvent('mousedown');
      tool.selectionContainer.select([new SpriteEntity()]);
      tool.mousedown(event);
      expect(unselected).toBe(true, 'Not unselected');
      expect(removed).toEqual(tool.selectionContainer, 'Not removed');
      expect(updated).toBe(true, 'Not updated');
      expect(reset).toBe(true, 'Not reset');
      expect(cleared).toBe(true, 'Not cleared');
      expect(pixiService.stage.getChildIndex(tool.selectionGraphics))
        .toBeGreaterThanOrEqual(0, 'Graphics are not added');
    });

    it('should autoselect the underlying entity immediately and trigger mousedown on the container', () => {
      const event = new MouseEvent('mousedown');
      pixiService.scene.filter = function(obj) { return <any>[new DisplayObject()]; };
      let mousedown = false;
      tool.selectionContainer.off('mousedown');
      tool.selectionContainer.on('mousedown', function() {
        expect(finished).toBe(true, 'Not finished');
        mousedown = true;
      });
      tool.mousedown(event);
      expect(mousedown).toBe(true, 'Not triggered on container');
    });
  });

  describe('mousemove', () => {
    let started = false;
    let cleared = false;
    let rendered = false;
    let styled = false;
    let updated = false;
    let drawn: Rectangle = null;

    beforeEach(() => {
      Pubsub.emit('ready', ngRef);
      tool.selectionRectangle.update = function() { updated = true; return tool.selectionRectangle.rectangle; };
      tool.selectionGraphics.clear = function() { cleared = true; return tool.selectionGraphics; };
      tool.selectionGraphics.lineStyle = function() { styled = true; return tool.selectionGraphics; };
      tool.selectionGraphics.beginFill = function() { started = true; return tool.selectionGraphics; };
      tool.selectionGraphics.drawShape = function(shape) { drawn = shape; return <any>tool.selectionGraphics; };
      tool.selectionGraphics.endFill = function() { rendered = true; return tool.selectionGraphics; };
    });

    it('should not execute if mousedown was not executed', () => {
      tool.mousemove(new MouseEvent('mousemove'));
      expect(rendered).toBe(false, 'Still executed');
    });

    it('should not execute if mousedown was executed but left mouse button was not pressed', () => {
      tool.mousedown(new MouseEvent('mousedown'));
      tool.mousemove(new MouseEvent('mousemove', { button: -1 }));
      expect(rendered).toBe(false, 'Still executed');
    });

    it('should execute if mousedown was executed and left button was pressed', () => {
      tool.mousedown(new MouseEvent('mousedown'));
      tool.mousemove(new MouseEvent('mousemove'));
      expect(updated).toBe(true, 'Not updated');
      expect(cleared).toBe(true, 'Not cleared');
      expect(styled).toBe(true, 'Not styled');
      expect(started).toBe(true, 'No beginFill');
      expect(drawn).toEqual(tool.selectionRectangle.rectangle, 'Not drawn');
      expect(rendered).toBe(true, 'Not rendered');
    });
  });

  describe('mouseup', () => {
    let finished = false;

    beforeEach(() => {
      Pubsub.emit('ready', ngRef);
      tool.finish = function() { finished = true; };
    });

    it('should not execute if mousedown was not executed', () => {
      tool.mouseup(new MouseEvent('mousedown'));
      expect(finished).toBe(false, 'Still executed');
    });

    it('should not execute if mousedown was executed but left mouse button was not pressed', () => {
      tool.mousedown(new MouseEvent('mousedown'));
      tool.mouseup(new MouseEvent('mousedown', { button: -1 }));
      expect(finished).toBe(false, 'Still executed');
    });

    it('should execute if mousedown was executed and left button was pressed', () => {
      tool.mousedown(new MouseEvent('mousedown'));
      tool.mouseup(new MouseEvent('mousemove'));
      expect(finished).toBe(true, 'Not executed');
    });
  });

  describe('finish', () => {
    let removed: Graphics = null;
    let added: SelectionContainer = null;
    let current: any[];

    beforeEach(() => {
      Pubsub.emit('ready', ngRef);
      pixiService.stage.removeChild = function(obj) { removed = <any>obj; return obj; };
      pixiService.scene.addChild = function(obj) { added = <any>obj; return obj; };
      tool.selectionContainer.select = function(obj) { current = <any>obj; return obj; };
    });

    it('should remove the graphics from the stage and trigger "finish"', () => {
      let triggered = false;
      tool.on('finish', () => triggered = true);
      tool.finish();
      expect(removed).toEqual(tool.selectionGraphics, 'Graphics not removed');
      expect(triggered).toBe(true, 'Not triggered');
    });

    it('should add the selection container to the scene if at least one entity has been selected and add them to the container', () => {
      const selected = [ new DisplayObject() ];
      pixiService.scene.filter = function() { return <any>selected; };
      tool.finish();
      expect(added).toEqual(tool.selectionContainer, 'Not added');
      expect(current).toEqual(selected, 'Not selected');
    });

    it('should not add the selection container to the scene if no entities hit the selection rectangle', () => {
      const selected = [];
      pixiService.scene.filter = function() { return <any>selected; };
      tool.finish();
      expect(added).not.toEqual(tool.selectionContainer, 'Still added');
      expect(current).not.toEqual(selected, 'Still selected');
    });
  });

});
