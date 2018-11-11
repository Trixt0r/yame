import { PixiService } from "ng/idx";
import { SelectionContainer } from "../container";
import { SelectionRenderer } from "../renderer";
import { SelectionResizeHandler } from "./resize";
import { HOR, VERT, LEFT, UP, RIGHT, DOWN } from "./resize/anchor";
import { SpriteEntity, Group } from "ng/module/pixi/idx";

describe('SelectionResizeHandler', () => {
  let service: PixiService;
  let container: SelectionContainer;
  let renderer: SelectionRenderer;
  let resize: SelectionResizeHandler;

  beforeEach(() => {
    service = new PixiService();
    service.setUp({ nativeElement: document.createElement('canvas') }, { });
    container = new SelectionContainer();
    service.scene.addChild(container);
    renderer = new SelectionRenderer(service, container);
    resize = new SelectionResizeHandler(container, renderer, service);
  });

  describe('initial', () => {
    it('should set up attached, detached and updated event handlers', () => {
      const attached = renderer.listeners('attached');
      const detached = renderer.listeners('detached');
      const updated = renderer.listeners('updated');
      expect(attached.find(fn => fn === resize.attached)).toBe(resize.attached, 'attached not registered');
      expect(detached.find(fn => fn === resize.detached)).toBe(resize.detached, 'detached not registered');
      expect(updated.find(fn => fn === resize.updated)).toBe(resize.updated, 'updated not registered');
    });

    it('should have 8 anchors on each corner and each side', () => {
      expect(resize.anchors.length).toBe(8, 'Wrong amount of anchors');
      let found = resize.anchors.find(anchor => anchor.type === (HOR | VERT | LEFT | UP));
      expect(found).toBeDefined('Top left anchor not found');
      found = resize.anchors.find(anchor => anchor.type === (VERT | UP));
      expect(found).toBeDefined('Top anchor not found');
      found = resize.anchors.find(anchor => anchor.type === (HOR | VERT | RIGHT | UP));
      expect(found).toBeDefined('Top right anchor not found');
      found = resize.anchors.find(anchor => anchor.type === (HOR | RIGHT));
      expect(found).toBeDefined('Right anchor not found');
      found = resize.anchors.find(anchor => anchor.type === (HOR | VERT | RIGHT | DOWN));
      expect(found).toBeDefined('Bottom right anchor not found');
      found = resize.anchors.find(anchor => anchor.type === (VERT | DOWN));
      expect(found).toBeDefined('Bottom anchor not found');
      found = resize.anchors.find(anchor => anchor.type === (HOR | VERT | LEFT | DOWN))
      expect(found).toBeDefined('Bottom left anchor not found');
      found = resize.anchors.find(anchor => anchor.type === (HOR | LEFT))
      expect(found).toBeDefined('Left anchor not found');
    });
  });

  describe('canBeActive', () => {
    it('should be true if a single non-group entity is selected', () => {
      container.select([new SpriteEntity()]);
      expect(resize.canBeActive).toBe(true);
    });

    it('should be true if a single non-group entity is selected', () => {
      container.select([new SpriteEntity(), new SpriteEntity()]);
      expect(resize.canBeActive).toBe(false);
    });

    it('should be true if a single non-group entity is selected', () => {
      container.select([new Group()]);
      expect(resize.canBeActive).toBe(false);
    });
  });

  describe('attached', () => {
    it('should add the anchors to the stage and listen to each, if one non-group entity is selected', () => {
      container.select([new SpriteEntity()]);
      resize.detached(service.stage);
      let rendered = 0;
      resize.anchors.forEach(anchor => anchor.render = function(){ rendered++; });
      resize.attached(service.stage);
      expect(rendered).toBe(resize.anchors.length, 'Wrong rendered amount');
      resize.anchors.forEach((anchor, i) => {
        expect(anchor.container).toBe(container, `Container not set ${i}`);
        expect(anchor.target).toBe(container.entities[0], `First entity not set as target ${i}`);
        let emitted = false;
        container.once('update', () => emitted = true);
        anchor.emit('update');
        expect(emitted).toBe(true, `"update" not emitted ${i}`);
        anchor.emit('handle:start');
        expect(container.currentHandler).toBe(anchor, `Handling not started on "handle:start" ${i}`);
        anchor.emit('handle:end');
        expect(container.currentHandler).toBeNull(`Handling ended on "handle:end" ${i}`);
        expect(service.stage.children.indexOf(anchor)).toBeGreaterThanOrEqual(0, `Anchor not added to stage ${i}`);
      });
    });

    it('should not add the anchors to the stage if multiple entities are selected', () => {
      container.select([new SpriteEntity(), new SpriteEntity()]);
      const stage = service.stage;
      resize.attached(stage);
      const children = service.stage.children;
      resize.anchors.forEach((anchor, i) => expect(children.indexOf(anchor)).toBeLessThan(0, `Anchor ${i} still added`));
    });

    it('should not add the anchors to the stage if a single group is selected', () => {
      container.select([new Group()]);
      const stage = service.stage;
      resize.attached(stage);
      const children = service.stage.children;
      resize.anchors.forEach((anchor, i) => expect(children.indexOf(anchor)).toBeLessThan(0, `Anchor ${i} still added`));
    });
  });

  describe('deatched', () => {
    it('should remove all anchors from the stage and all handle listeners from the anchors', () => {
      container.select([new SpriteEntity()]);
      resize.detached(service.stage);
      resize.anchors.forEach((anchor, i) => {
        expect(anchor.container).toBeNull(`Container not reset ${i}`);
        expect(anchor.target).toBeNull(`Target not reset ${i}`);
        expect(anchor.listeners('update').length).toBe(0, `'update' listeners not removed ${i}`);
        expect(anchor.listeners('handle:start').length).toBe(0, `'handle:start' listeners not removed ${i}`);
        expect(anchor.listeners('handle:end').length).toBe(0, `'handle:end' listeners not removed ${i}`);
        expect(service.stage.children.indexOf(anchor)).toBeLessThan(0, `Anchor still added to stage ${i}`);
      });
    });
  });

  describe('updated', () => {
    it('should update each anchor if canBeActive', () => {
      container.select([new SpriteEntity()]);
      let updates = 0;
      resize.anchors.forEach(anchor => anchor.update = function(){ updates++; });
      resize.updated(service.stage);
      expect(updates).toBe(resize.anchors.length, 'Wrong update amount');
    });
    it('should not update each anchor if not canBeActive', () => {
      container.select([new SpriteEntity(), new SpriteEntity()]);
      let updates = 0;
      resize.anchors.forEach(anchor => anchor.update = function(){ updates++; });
      resize.updated(service.stage);
      expect(updates).toBe(0, 'Still updated amount');
    });
  });
});
