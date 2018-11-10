import { Container, Point, Rectangle, Circle } from "pixi.js";
import { SelectionRectangle } from "./rectangle";
import { Entity } from "ng/idx";

class MyEntity extends Entity {

  contains: boolean = false;

  clone(): Promise<Entity> {
    return Promise.resolve(new MyEntity());
  }

  containsPoint() {
    return this.contains;
  }

}

describe('SelectionRectangle', () => {

  describe('initial', () => {
    it('should have a topLeft and a bottomRight point and a rectangle', () => {
      const rect = new SelectionRectangle(new Container());
      expect(rect.topLeft instanceof Point).toBe(true, 'topLeft is not a point');
      expect(rect.bottomRight instanceof Point).toBe(true, 'bottomRight is not a point');
      expect(rect.rectangle instanceof Rectangle).toBe(true, 'rectangle is not a Rectangle');
    });

    it('should accept topLeft and bottomRight points in the constructor', () => {
      const topLeft = new Point(100, -100);
      const bottomRight = new Point(500, 600);
      const rect = new SelectionRectangle(new Container(), topLeft, bottomRight);
      expect(rect.topLeft).not.toBe(topLeft, 'topLeft ref was not copied but stored');
      expect(rect.bottomRight).not.toBe(bottomRight, 'bottomRight ref was not copied but stored');
      expect(rect.topLeft.x).toBe(topLeft.x, 'Wrong x value for topLeft');
      expect(rect.topLeft.y).toBe(topLeft.y, 'Wrong y value for topLeft');
      expect(rect.bottomRight.x).toBe(bottomRight.x, 'Wrong x value for bottomRight');
      expect(rect.bottomRight.y).toBe(bottomRight.y, 'Wrong y value for bottomRight');
    });
  });

  describe('update', () => {
    it('should fix the rectangle and return the internal rectangle', () => {
      const rect = new SelectionRectangle(new Container());
      const old = SelectionRectangle.fixRectangle;
      let called = false;
      SelectionRectangle.fixRectangle = function() { called = true; return old.apply(SelectionRectangle, arguments); };
      const re = rect.update();
      expect(called).toBe(true, 'Not called fixRectangle');
      expect(re).toBe(rect.rectangle, 'No rectangle returned');
      SelectionRectangle.fixRectangle = old;
    });
  });

  describe('reset', () => {
    it('should reset the corner positions and size', () => {
      const rect = new SelectionRectangle(new Container());
      rect.reset();
      const rectangle = rect.rectangle;
      expect(rect.topLeft.x).toBe(Infinity, 'Wrong x value for topLeft');
      expect(rect.topLeft.y).toBe(Infinity, 'Wrong y value for topLeft');
      expect(rect.bottomRight.x).toBe(Infinity, 'Wrong x value for bottomRight');
      expect(rect.bottomRight.y).toBe(Infinity, 'Wrong y value for bottomRight');
      expect(rectangle.width).toBe(-1, 'Wrong reset width');
      expect(rectangle.height).toBe(-1, 'Wrong reset height');
    });
  });

  describe('contains', () => {

    let rect: SelectionRectangle;
    let entity: MyEntity;

    beforeEach(() => {
      rect = new SelectionRectangle(new Container());
      entity = new MyEntity();
    });

    it('should return true if a corner point of the rectangle lies in the entity', () => {
      entity.contains = true;
      expect(rect.contains(entity)).toBe(true, 'Not containing the entity');
    });

    it('should return false if the entity has no shape', () => {
      entity.getShape = function() { return null; };
      expect(rect.contains(entity)).toBe(false, 'Still containing the entity');
    });

    it('should return false if a corner of the entity lies in the rectangle but update was not called', () => {
      rect.container.addChild(entity);
      entity.getShape = function() {
        return new Rectangle(0, 0, 50, 50);
      }
      rect.topLeft.set(-5, -5);
      rect.bottomRight.set(25, 25);
      expect(rect.contains(entity)).toBe(false, 'Still containing');
    });

    it('should return false if the shape of the entity is not a rectangle or rounded rectangle', () => {
      rect.container.addChild(entity);
      entity.getShape = function() {
        return new Circle(0, 0, 50);
      }
      rect.topLeft.set(-5, -5);
      rect.bottomRight.set(25, 25);
      rect.update();
      expect(rect.contains(entity)).toBe(false, 'Returned true for other shape than rectanle or rounded rectangle');
    });

    it('should return true if one corner of the entity lies in the rectangle', () => {
      rect.container.addChild(entity);
      entity.getShape = function() {
        return new Rectangle(0, 0, 50, 50);
      }
      rect.topLeft.set(-5, -5);
      rect.bottomRight.set(25, 25);
      rect.update();
      expect(rect.contains(entity)).toBe(true, 'Not containing the top left corner');

      rect.topLeft.set(25, -5);
      rect.bottomRight.set(55, 25);
      rect.update();
      expect(rect.contains(entity)).toBe(true, 'Not containing the top right corner');

      rect.topLeft.set(-5, 25);
      rect.bottomRight.set(25, 55);
      rect.update();
      expect(rect.contains(entity)).toBe(true, 'Not containing the bottom left');

      rect.topLeft.set(25, 25);
      rect.bottomRight.set(55, 55);
      rect.update();
      expect(rect.contains(entity)).toBe(true, 'Not containing the bottom right');
    });

    it('should return false if no corner of the entity lies in the rectangle', () => {
      rect.container.addChild(entity);
      entity.getShape = function() {
        return new Rectangle(0, 0, 50, 50);
      }
      rect.topLeft.set(-15, -15);
      rect.bottomRight.set(-10, -10);
      rect.update();
      expect(rect.contains(entity)).toBe(false, 'Containing the top left corner');

      rect.topLeft.set(25, -15);
      rect.bottomRight.set(55, -10);
      rect.update();
      expect(rect.contains(entity)).toBe(false, 'Containing the top right corner');

      rect.topLeft.set(-15, 25);
      rect.bottomRight.set(-5, 55);
      rect.update();
      expect(rect.contains(entity)).toBe(false, 'Containing the bottom left');

      rect.topLeft.set(65, 25);
      rect.bottomRight.set(70, 55);
      rect.update();
      expect(rect.contains(entity)).toBe(false, 'Containing the bottom right');
    });
  });

  describe('fixRectangle', () => {
    it('should create a correct rectangle for two given corner points correctly aligned', () => {
      const rect = SelectionRectangle.fixRectangle(new Point(-325, 500), new Point(50, 600));
      expect(rect.x).toBe(-325, 'Wrong x position of rectangle');
      expect(rect.y).toBe(500, 'Wrong y position of rectangle');
      expect(rect.width).toBe(375, 'Wrong width of rectangle');
      expect(rect.height).toBe(100, 'Wrong height of rectangle');
    });

    it('should create a correct rectangle for two given corner points in incorrect order', () => {
      let rect = SelectionRectangle.fixRectangle(new Point(50, 600), new Point(-325, 500));
      expect(rect.x).toBe(-325, 'Wrong x position of rectangle');
      expect(rect.y).toBe(500, 'Wrong y position of rectangle');
      expect(rect.width).toBe(375, 'Wrong width of rectangle');
      expect(rect.height).toBe(100, 'Wrong height of rectangle');

      rect = SelectionRectangle.fixRectangle(new Point(-325, 600), new Point(50, 500));
      expect(rect.x).toBe(-325, 'Wrong x position of rectangle');
      expect(rect.y).toBe(500, 'Wrong y position of rectangle');
      expect(rect.width).toBe(375, 'Wrong width of rectangle');
      expect(rect.height).toBe(100, 'Wrong height of rectangle');

      rect = SelectionRectangle.fixRectangle(new Point(50, 500), new Point(-325, 600));
      expect(rect.x).toBe(-325, 'Wrong x position of rectangle');
      expect(rect.y).toBe(500, 'Wrong y position of rectangle');
      expect(rect.width).toBe(375, 'Wrong width of rectangle');
      expect(rect.height).toBe(100, 'Wrong height of rectangle');
    });

    it('should apply the data to the given target, if passed', () => {
      const target = <any>{ };
      SelectionRectangle.fixRectangle(new Point(-325, 500), new Point(50, 600), target);
      expect(target.x).toBe(-325, 'Wrong x position in target');
      expect(target.y).toBe(500, 'Wrong y position in target');
      expect(target.width).toBe(375, 'Wrong width in target');
      expect(target.height).toBe(100, 'Wrong height in target');
    });
  });

});
