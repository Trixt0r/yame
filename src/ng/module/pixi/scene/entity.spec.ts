import { Entity, EntityType } from "./entity";
import { EntityException } from "../exception/entity/entity";

@EntityType('mytestentity')
class MyEntity extends Entity {

  clone(): Promise<Entity> {
    throw new Error("Method not implemented.");
  }
}


describe('Scene', () => {

  describe('Entity', () => {
    let entity: MyEntity;

    beforeEach(() => entity = new MyEntity());

    describe('Decorator', () => {
      it('should define the new entity type', () => {
        expect(Entity.getEntityType('mytestentity')).toBeDefined('No entity type defined');
        expect(Entity.getEntityType('mytestentity')).toBe(MyEntity, 'Wrong entity type defined');
      });

      it('should find the correct entity type for an entity instance', () => {
        expect(Entity.getEntityTypeOf(entity)).toEqual('mytestentity');
      });
    });

    describe('Properties', () => {
      it('should define getters and setters for id, name and parentEntity', () => {
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

      it('should have a default id', () => {
        expect(typeof entity.id === 'string').toBe(true, 'No id defined');
      });

      it('should have no parent entity', () => {
        expect(entity.parentEntity).toBeNull('A parent entity is defined');
      });

      it('should have an export data object', () => {
        expect(entity.exportData).toBeDefined('No export data defined');
      });
    });

    describe('export', () => {
      it('should resolve the current exportData', (done) => {
        entity.export('')
          .then(data => {
            expect(data).toBeDefined('No export data resolved');
            expect(data).toBe(entity.exportData);
            done();
          })
          .catch(() => fail('Should not fail during export'));
      });

      it('should emit the export event', (done) => {
        let spy = { fn: function(data) { expect(data).toBe(entity.exportData, 'The incorrect value has been emitted'); } };
        spyOn(spy, 'fn');
        entity.once('exported', spy.fn);
        entity.export('')
          .then(() => expect(spy.fn).toHaveBeenCalledTimes(1))
          .then(done)
          .catch(() => fail('Should not fail during export'));
      });
    });

    describe('parse', () => {
      it('apply the given data', (done) => {
        const data = {
          id: 'test',
          name: 'noname',
          type: 'mytestentity'
        };
        entity.parse(data, '')
          .then(res => {
            expect(res).toBe(entity, 'Entity has not been resolved');
            expect(entity.id).toBe('test', 'The parsed id has not been applied');
            expect(entity.name).toBe('noname', 'The parsed name has not been applied');
            done();
          })
          .catch(() => fail('Should not fail while parsing'));
      });

      it('should emit the parsed event', (done) => {
        const data = {
          id: 'test',
          name: 'noname',
          type: 'mytestentity'
        };
        let spy = { fn: function(parsed) { expect(data).toBe(parsed, 'The incorrect value has been emitted'); } };
        spyOn(spy, 'fn');
        entity.once('parsed', spy.fn);
        entity.parse(data, '')
          .then(() => expect(spy.fn).toHaveBeenCalledTimes(1))
          .then(done)
          .catch(() => fail('Should not fail while parsing'));
      });

      it('should reject if no id has been provided', (done) => {
        const data = {
          id: '',
          name: 'noname',
          type: 'mytestentity'
        };
        entity.parse(data, '')
          .then(() => fail('Should fail while parsing'))
          .catch(e => {
            expect(e instanceof EntityException).toBe(true, 'Wrong exception type rejected');
            expect(e.message).toEqual('No id provided for parsing');
          })
          .then(done);
      });
    });

  });
})
