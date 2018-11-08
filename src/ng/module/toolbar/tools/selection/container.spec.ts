import { SelectionContainer } from "./container";
import { SpriteEntity, Entity, Group } from "ng/module/pixi/idx";

describe('SelectionContainer', () => {

  let container: SelectionContainer;

  beforeEach(() => container = new SelectionContainer());

  describe('beginHandling', () => {
    it('should be in handling state and have a current handler and emit "handle:start" with the passed args', () => {
      const ref = { };
      let called = false;
      container.on('handle:start', (a, b, c, d) => {
        called = true;
        expect(a).toBe(1, 'Wrong first argument');
        expect(b).toBe('2', 'Wrong second argument');
        expect(c).toBe(false, 'Wrong third argument');
        expect(d).toBeUndefined('Wrong fourht argument. Is defined!');
      });
      container.beginHandling(ref, 1, '2', false);
      expect(container.isHandling).toBe(true, 'Not handling');
      expect(container.currentHandler).toBe(ref, 'Wrong handler');
      expect(called).toBe(true, 'Handler not called');
    });

    it('should throw an exception if already handling', () => {
      container.beginHandling({ });
      expect(container.beginHandling.bind(container, { }))
        .toThrowError('beginHandling has already been called. endHandling has to be called before!');
    });
  });

  describe('endHandling', () => {
    it('should throw an exception if beginHandling has not been called', () => {
      expect(container.endHandling.bind(container, { })).toThrowError('beginHandling has to be called before!');
    });

    it('should throw an exception if beginHandling was called with a different reference', () => {
      container.beginHandling({ });
      expect(container.endHandling.bind(container, { }))
        .toThrowError('You are not allowed to call this, since the handling was not started by the given reference');
    });

    it("shouldn't be in handling state and not have a current handler and emit 'handle:end' with the parsed args", () => {
      const ref = { };
      let called = false;
      container.on('handle:end', (a, b, c, d) => {
        called = true;
        expect(a).toBe('1', 'Wrong first argument');
        expect(b).toBe(2, 'Wrong second argument');
        expect(c).toBe(true, 'Wrong third argument');
        expect(d).toBeUndefined('Wrong fourht argument. Is defined!');
      });
      container.beginHandling(ref);
      container.endHandling(ref, '1', 2, true);
      expect(container.isHandling).toBe(false, 'Still handling');
      expect(container.currentHandler).toBeNull('Handler not removed');
      expect(called).toBe(true, 'Handler not called');
    });
  });

  describe('select', () => {
    const toSelect = [];
    beforeEach(() => {
      toSelect.length = 0;
      for (let i = 0; i < 10; i++) {
        toSelect.push(new SpriteEntity());
      }
    });

    it('should add the given entities to the container and emit the "selected" event', () => {
      let called = false;
      container.on('selected', (entities) => {
        called = true;
        expect(entities.length).toBe(toSelect.length, 'Wrong amount emitted');
      });
      container.select(toSelect);
      expect(container.length).toBe(toSelect.length, 'Wrong amount added');
      expect(container.interactive).toBe(true, 'Not interactive');
      expect(called).toBe(true, 'Event not emitted');
    });

    it('should emit the "selected" event on each added entity', () => {
      let called = 0;
      toSelect.forEach(entity => entity.on('selected', () => called++));
      container.select(toSelect);
      expect(called).toBe(toSelect.length, 'Event not emitted as many times as added');
    });

    it('should not select already selected entities and warn about already selected entities', () => {
      let called = 0;
      let warned = 0;
      const oldWarn = console.warn;
      console.warn = function() { warned++; };
      container.select(toSelect);
      toSelect.forEach(entity => entity.on('selected', () => called++));
      container.select(toSelect);
      expect(called).toBe(0, 'Event emitted twice');
      expect(warned).toBe(toSelect.length, 'Not warned');
      console.warn = oldWarn;
    });
  });

  describe('unselect', () => {
    const toSelect: SpriteEntity[] = [];
    beforeEach(() => {
      toSelect.length = 0;
      for (let i = 0; i < 10; i++) {
        toSelect.push(new SpriteEntity());
      }
      container.select(toSelect);
    });

    it('should unselect all selected entities by default and emit the "unselected" event and not be interactive', () => {
      let called = false;
      container.on('unselected', removed => {
        called = true;
        expect(removed.length).toBe(toSelect.length, 'Wrong amount removed');
      });
      container.unselect();
      expect(container.entities.length).toBe(0, 'Not all entities removed');
      expect(container.interactive).toBe(false, 'Still interactive');
      expect(called).toBe(true, 'Not emitted');
    });

    it('should unselect a part of the selected entities and emit the "unselected" event but be interactive', () => {
      let called = false;
      const toRemove = toSelect.slice(0, Math.round(toSelect.length / 2));
      container.on('unselected', removed => {
        called = true;
        expect(removed.length).toBe(toRemove.length, 'Wrong amount removed');
      });
      container.unselect(toRemove);
      expect(container.entities.length).toBe(toSelect.length - toRemove.length, 'Not correct amount removed');
      expect(container.interactive).toBe(true, 'Not interactive');
      expect(called).toBe(true, 'Not emitted');
    });

    it('should emit the "unselected" event on each removed entity', () => {
      let called = 0;
      toSelect.forEach(entity => entity.on('unselected', () => called++));
      container.unselect();
      expect(called).toBe(toSelect.length, 'Event not emitted as many times as removed');
    });

    it('should end the current handling, if any', () => {
      container.beginHandling({ });
      container.unselect();
      expect(container.isHandling).toBe(false, 'Still handling');
      expect(container.currentHandler).toBeNull('Handler not removed');
    });

    it('should restore the previous relation', () => {
      container.unselect();
      const parent = new Group();
      return Promise.all(toSelect.map(entity => parent.addEntity(entity)))
              .then(() => {
                container.select(toSelect);
                container.unselect();
                toSelect.forEach(entity => expect(entity.parent).toBe(parent, 'Wrong parent'));
              });
    });

  });

});
