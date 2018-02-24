import { Property } from "./property";
import { Entity } from "./entity";

class MyEntity extends Entity {

  @Property(true) myProperty;
  @Property(false) myInternalProperty;

  clone(): Promise<Entity> {
    throw new Error("Method not implemented.");
  }
}

describe('Scene', () => {

  describe('Property', () => {

    let entity: MyEntity;

    beforeEach(() => entity = new MyEntity());

    it('should define getters and setters for the properties', () => {
      const proto = Object.getPrototypeOf(entity);
      const myPropertyDescriptor = Object.getOwnPropertyDescriptor(proto, 'myProperty');
      const myInternalPropertyDescriptor = Object.getOwnPropertyDescriptor(proto, 'myInternalProperty');
      expect(typeof myPropertyDescriptor.get === 'function').toBe(true, 'No get function defined (myProperty)');
      expect(typeof myInternalPropertyDescriptor.get === 'function').toBe(true, 'No get function defined (myInternalProperty)');
      expect(typeof myPropertyDescriptor.set === 'function').toBe(true, 'No set function defined (myProperty)');
      expect(typeof myInternalPropertyDescriptor.set === 'function').toBe(true, 'No set function defined (myInternalProperty)');
    });

    it('should define getters and setters for the inherited properties', () => {
      const proto = Object.getPrototypeOf(Object.getPrototypeOf(entity));
      const idDescriptor = Object.getOwnPropertyDescriptor(proto, 'id');
      const nameDescriptor = Object.getOwnPropertyDescriptor(proto, 'name');
      const parentEntityDescriptor = Object.getOwnPropertyDescriptor(proto, 'parentEntity');
      expect(typeof idDescriptor.get === 'function').toBe(true, 'No get function defined (id)');
      expect(typeof nameDescriptor.get === 'function').toBe(true, 'No get function defined (name)');
      expect(typeof parentEntityDescriptor.get === 'function').toBe(true, 'No get function defined (parentEntity)');
      expect(typeof idDescriptor.set === 'function').toBe(true, 'No set function defined (id)');
      expect(typeof nameDescriptor.set === 'function').toBe(true, 'No set function defined (name)');
      expect(typeof parentEntityDescriptor.set === 'function').toBe(true, 'No set function defined (parentEntity)');
    });

    it('should allow full access to the defined property', () => {
      expect(entity.myProperty).toBeUndefined('The property should not be defined');
      entity.myProperty = true;
      expect(entity.myProperty).toBe(true, 'Property has no been set');
    });

    it('should trigger the change event on change', () => {
      let spy = { fn: function(value, previous) { expect(value).toEqual('test', 'The value has not changed properly'); } };
      spyOn(spy, 'fn');
      entity.once('change:myProperty', spy.fn);
      entity.myProperty = 'test';
      expect(spy.fn).toHaveBeenCalledTimes(1);
    });

    it('should not trigger the change event on no change', () => {
      let spy = { fn: function(value, previous) { expect(value).toEqual('test', 'The value has not changed properly'); } };
      spyOn(spy, 'fn');
      entity.myProperty = 'test';
      entity.once('change:myProperty', spy.fn);
      entity.myProperty = 'test';
      expect(spy.fn).not.toHaveBeenCalledTimes(1);
    });

    it('should export the set data to the export data of the entity if marked', () => {
      entity.myProperty = 'some data';
      expect(entity.exportData.myProperty).toBe('some data', 'Property has not been exported');
    });

    it('should not export the set data to the export data of the entity if not marked', () => {
      entity.myInternalProperty = 'some data';
      expect(entity.exportData.myInternalProperty).toBeUndefined('Property has been exported');
    });

  });
});
