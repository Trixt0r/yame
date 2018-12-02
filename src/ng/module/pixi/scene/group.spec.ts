import { Group } from "./group";
import { Entity, EntityType } from "./entity";
import { GroupException } from "../exception/entity/group";
import * as _ from 'lodash';

@EntityType()
class MyEntity extends Entity {
  clone(): Promise<Entity> {
    let clone = new MyEntity(`Copy of ${this.name}`);
    return Promise.resolve(clone);
  }
}

describe('Scene', () => {
  describe('Group', () => {
    let group: Group<MyEntity>;

    beforeEach(() => group = new Group('my group'));

    describe('initial', () => {
      it('should have no entities', () => expect(group.entities.length).toBe(0, 'The group has entities'));
    });

    describe('indexOf', () => {
      it('should return the correct index for the previously added entity', done => {
        group.addEntity(new MyEntity())
          .then(entity => {
            expect(group.indexOf(entity)).toBe(0, 'Wrong index for previously added entity');
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should return the correct index for the previously added entity id', done => {
        group.addEntity(new MyEntity())
          .then(entity => {
            expect(group.indexOf(entity.id)).toBe(0, 'Wrong index for previously added entity id');
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should return -1 for an entity which has not been added', () => {
        expect(group.indexOf(new MyEntity())).toBe(-1, 'Wrong index for not added entity');
      });

      it('should return -1 for an entity id which has not been added', () => {
        expect(group.indexOf('invalid')).toBe(-1, 'Wrong index for not added entity id');
      });
    });

    describe('addEntity', () => {
      it('should add a new entity to the group', done => {
        let entity = new MyEntity();
        let length = group.length;
        group.addEntity(entity)
          .then(re => {
            expect(group.length).toBe(length + 1, 'Amount of entities has not changed');
            expect(re).toBe(entity, 'Wrong result resolved');
            expect(group.indexOf(entity)).toBe(0, 'Entity has wrong index');
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should add a new entity to the group', done => {
        let entityData = {
          id: 'myId',
          name: 'myEntity',
          type: 'myentity',
          visibility: true,
          locked: false,
        };
        let length = group.length;
        group.addEntity(entityData)
          .then(re => {
            expect(group.length).toBe(length + 1, 'Amount of entities has not changed');
            expect(re instanceof MyEntity).toBe(true, 'Has not resolved an entity of the parsed type');
            expect(group.indexOf('myId')).toBe(0, 'Entity has wrong index');
            expect(re.id).toEqual('myId', 'Id has not been parsed');
            expect(re.name).toEqual('myEntity', 'Name has not been parsed');
            expect(re.visibility).toEqual(true, 'Visibility has not been parsed');
            expect(re.locked).toEqual(false, 'Locked has not been parsed');
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should reject if an entity with the same id has been already added', done => {
        let entity = new MyEntity();
        let length = group.length;
        group.addEntity(entity)
          .then(() => group.addEntity(entity))
          .then(() => {
            fail('Should not resolve');
            done();
          })
          .catch(e => {
            expect(e instanceof GroupException).toBe(true, 'Wrong exception type rejected');
            expect(e.message).toEqual(`Duplicate entity id ${entity.id} within group not allowed!`);
            done();
          });
      });

      it('should emit the added:entity event', done => {
        let entity = new MyEntity();
        let handler = { fn: function(re){ expect(re).toBe(entity, 'Wrong result passed'); } };
        spyOn(handler, 'fn');
        group.on('added:entity', handler.fn);
        group.addEntity(entity)
          .then(re => {
            expect(handler.fn).toHaveBeenCalledTimes(1);
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });
    });

    describe('addEntities', () => {
      it('should add the given array of entites to the group', done => {
        let entities = [new MyEntity(), new MyEntity(), new MyEntity()];
        let length = group.length;
        group.addEntities(entities)
          .then(re => {
            expect(group.length).toBe(length + entities.length, 'Wrong amount of entities added');
            expect(re.length).toBe(entities.length, 'Wrong amount of added entities resolved');
            entities.forEach(
              ent => expect(group.indexOf(ent) >= 0).toBe(true, `Entity ${ent.id} has not been added to the group`)
            );
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should add the given array of entity data to the group', done => {
        let origin = { type: 'myentity' };
        let entities = [
          _.extend({ id: _.uniqueId(), name: 'bla', visibility: true, locked: false }, origin),
          _.extend({ id: _.uniqueId(), name: 'ble', visibility: true, locked: false }, origin),
          _.extend({ id: _.uniqueId(), name: 'blo', visibility: true, locked: false }, origin),
        ];
        let length = group.length;
        group.addEntities(entities)
          .then(re => {
            expect(group.length).toBe(length + entities.length, 'Wrong amount of entities added');
            expect(re.length).toBe(entities.length, 'Wrong amount of added entities resolved');
            re.forEach(
              ent => expect(ent instanceof MyEntity).toBe(true, `Entity ${ent.id} has not the correct instance type`)
            );
            entities.forEach(
              ent => expect(group.indexOf(ent.id) >= 0).toBe(true, `Entity ${ent.id} has not been added to the group`)
            );
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should add the given array of mixed entity data and entity instances to the group', done => {
        let origin = { type: 'myentity' };
        let entities = [
          _.extend({ id: _.uniqueId(), name: 'bla', visibility: true, locked: false }, origin),
          new MyEntity(),
          _.extend({ id: _.uniqueId(), name: 'blo', visibility: true, locked: false }, origin),
        ];
        let length = group.length;
        group.addEntities(entities)
          .then(re => {
            expect(group.length).toBe(length + entities.length, 'Wrong amount of entities added');
            expect(re.length).toBe(entities.length, 'Wrong amount of added entities resolved');
            re.forEach(
              ent => expect(ent instanceof MyEntity).toBe(true, `Entity ${ent.id} has not the correct instance type`)
            );
            entities.forEach(
              ent => expect(group.indexOf(ent.id) >= 0).toBe(true, `Entity ${ent.id} has not been added to the group`)
            );
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should emit the added:entities event', done => {
        let handler = { fn: function(re){ expect(re.length).toBe(0, 'Wrong amount of data passed'); } };
        spyOn(handler, 'fn');
        group.on('added:entities', handler.fn);
        group.addEntities([])
          .then(re => {
            expect(handler.fn).toHaveBeenCalledTimes(1);
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });
    });

    describe('removeEntity', () => {
      it('should remove the previously added entity', done => {
        let entity = new MyEntity();
        group.addEntity(entity)
          .then(() => {
            let length = group.length;
            return group.removeEntity(entity)
              .then(re => {
                expect(group.length).toBe(length - 1, 'Amount of entites has not changed');
                expect(group.indexOf(entity)).toBe(-1, 'Entity has not been removed');
                expect(group.children.indexOf(entity)).toBe(-1, 'Entity has not been removed from pixi list');
                expect(re).toBe(entity, 'Wrong entity resolved');
                done();
              });
          })
          .catch(e => {
            fail('Should not have been rejected');
            done();
          });
        });

      it('should remove the previously added id', done => {
        let entity = new MyEntity();
        group.addEntity(entity)
          .then(() => {
            let length = group.length;
            return group.removeEntity(entity.id)
              .then(re => {
                expect(group.length).toBe(length - 1, 'Amount of entites has not changed');
                expect(group.indexOf(entity.id)).toBe(-1, 'Entity has not been removed');
                expect(group.children.indexOf(entity)).toBe(-1, 'Entity has not been removed from pixi list');
                expect(re).toBe(entity, 'Wrong entity resolved');
                done();
              });
          })
          .catch(e => {
            fail('Should not have been rejected');
            done();
          });
        });

      it('should emit the removed:entity event', done => {
        let entity = new MyEntity();
        let handler = { fn: function(ent){ expect(ent).toBe(entity, 'Wrong entity passed'); }};
        spyOn(handler, 'fn');
        group.on('removed:entity', handler.fn);
        group.addEntity(entity)
          .then(() => {
            let length = group.length;
            return group.removeEntity(entity)
              .then(() => {
                expect(handler.fn).toHaveBeenCalledTimes(1);
                done();
              });
          })
          .catch(e => {
            fail('Should not have been rejected');
            done();
          });
        });

      it('should reject if the entity is not part of the group', done => {
        let entity = new MyEntity();
        return group.removeEntity(entity)
          .then(() => {
            fail('Should not resolve')
            done();
          })
          .catch(e => {
            expect(e instanceof GroupException).toBe(true, 'Wrong exception type');
            expect(e.message).toEqual(`Entity for id ${entity.id} not found.`);
            done();
          });
      });
    });

    describe('removeEntities', () => {
      it('should remove a part of entites from the group', done => {
        group.addEntities([new MyEntity(), new MyEntity(), new MyEntity(), new MyEntity(), new MyEntity()])
          .then(() => {
            let toRemove = group.entities.slice(0, 2);
            let length = group.length;
            return group.removeEntities(toRemove)
              .then(removed => {
                expect(group.length).toBe(length - toRemove.length, 'Entities have not been removed');
                expect(removed.length).toBe(toRemove.length, 'Wrong amount removed');
                toRemove.forEach(
                  entity => expect(group.indexOf(entity) < 0).toBe(true, `Entity ${entity.id} has not been removed`)
                );
                done();
              });
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should remove a part of entity ids from the group', done => {
        group.addEntities([new MyEntity(), new MyEntity(), new MyEntity(), new MyEntity(), new MyEntity()])
          .then(() => {
            let toRemove = group.entities.slice(0, 2).map(entity => entity.id);
            let length = group.length;
            return group.removeEntities(toRemove)
              .then(removed => {
                expect(group.length).toBe(length - toRemove.length, 'Entities have not been removed');
                expect(removed.length).toBe(toRemove.length, 'Wrong amount removed');
                toRemove.forEach(
                  entity => expect(group.indexOf(entity) < 0).toBe(true, `Entity ${entity} has not been removed`)
                );
                done();
              });
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should remove a mixed part of entity ids and entites from the group', done => {
        group.addEntities([new MyEntity(), new MyEntity(), new MyEntity(), new MyEntity(), new MyEntity()])
          .then(added => {
            let toRemove = [added[0], added[1].id];
            let length = group.length;
            return group.removeEntities(toRemove)
              .then(removed => {
                expect(group.length).toBe(length - toRemove.length, 'Entities have not been removed');
                expect(removed.length).toBe(toRemove.length, 'Wrong amount removed');
                toRemove.forEach(
                  entity => expect(group.indexOf(entity) < 0).toBe(true, `Entity ${entity} has not been removed`)
                );
                done();
              });
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should emit the removed:entities event', done => {
        let handler = { fn: function(re) { expect(re.length).toBe(0, 'Wrong array passed'); } };
        spyOn(handler, 'fn');
        group.on('removed:entities', handler.fn);
        group.removeEntities([])
          .then(() => {
            expect(handler.fn).toHaveBeenCalledTimes(1);
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });
    });

    describe('clear', () => {
      it('should remove all entites from the group', done => {
        group.addEntities([new MyEntity(), new MyEntity(), new MyEntity(), new MyEntity(), new MyEntity()])
          .then(() => {
            return group.clear()
              .then(removed => {
                expect(group.entities.length).toBe(0, 'Entities have not been removed');
                expect(removed.length).toBe(5, 'Wrong amount removed');
                done();
              });
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should emit the cleared event', done => {
        let handler = { fn: function(re) { expect(re.length).toBe(0, 'Wrong array passed'); } };
        spyOn(handler, 'fn');
        group.on('cleared', handler.fn);
        group.clear()
          .then(() => {
            expect(handler.fn).toHaveBeenCalledTimes(1);
            done();
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });
    });

    describe('export', () => {
      it ('should export the group and all entities of the group', done => {
        group.addEntities([new MyEntity(), new MyEntity(), new MyEntity()])
          .then(entities => {
            return group.export('')
              .then(data => {
                expect(data.entities.length).toBe(group.length, 'Wrong amount of entities has been exported');
                entities.forEach(
                  entity => expect(data.entities.findIndex(d => d.id === entity.id) >= 0)
                              .toBe(true, `Entity ${entity.id} has not been exported`)
                );
                expect(data.id).toEqual(group.id, 'Id has not been exported');
                expect(data.name).toEqual(group.name, 'Id has not been exported');
              })
          })
          .then(done)
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });
    });

    describe('parse', () => {
      it('should reject if the data does not contain an entity array', done => {
        let data = {
          entities: <any>{},
          id: 'myGroup',
          name: 'test',
          type: 'group',
          visibility: true,
          locked: false,
        };
        group.parse(data, '')
              .then(() => {
                fail('Should not resolve')
                done();
              })
              .catch(e => {
                expect(e instanceof GroupException).toBe(true, 'Wrong exception type rejected');
                expect(e.message).toEqual('No valid entities provided', 'Wrong error message');
                done();
              });
      });

      it('should apply the data to the group and add the parsed entities', done => {
        let data = {
          entities: [{
            id: 'anId',
            name: 'myEntity',
            type: 'myentity',
            visibility: true,
            locked: false,
          }],
          id: 'myGroup',
          name: 'test',
          type: 'group',
          visibility: true,
          locked: false,
        };
        group.parse(data, '')
          .then(re => {
            expect(re).toBe(group, 'Wrong resolve value');
            expect(group.id).toEqual('myGroup', 'Id has not been applied to group');
            expect(group.name).toEqual('test', 'Name has not been applied to group');
            expect(group.length).toBe(1, 'Entities have not been added');
            let entity = group.entities[0];
            expect(entity.id).toEqual('anId', 'Id has not been applied to the entity');
            expect(entity.name).toEqual('myEntity', 'Id has not been applied to the entity');
            done();
          })
        .catch(() => {
          fail('Should not have been rejected');
          done();
        });
      });

      it('should remove the current entities after parsing', done => {
        let data = {
          entities: [{
            id: 'anId',
            name: 'myEntity',
            type: 'myentity',
            visibility: true,
            locked: false,
          }],
          id: 'myGroup',
          name: 'test',
          type: 'group',
          visibility: true,
          locked: false,
        };
        let prevEntity = new MyEntity('myOtherEntity');
        group.addEntity(prevEntity)
          .then(() => {
            return group.parse(data, '')
              .then(re => {
                expect(group.length).toBe(1, 'Amount of entities is not correct');
                expect(group.entities.indexOf(prevEntity)).toBe(-1, 'Previous entity has not been removed');
                done();
              });
          })
          .catch(() => {
            fail('Should not have been rejected');
            done();
          });
      });

      it('should keep the current entities when parsing fails', done => {
        let data = {
          entities: [{
            id: <any>false,
            name: 'myEntity',
            type: 'myentity',
            visibility: true,
            locked: false,
          }],
          id: 'myGroup',
          name: 'test',
          type: 'group',
          visibility: true,
          locked: false,
        };
        group.addEntities([new MyEntity(), new MyEntity()])
          .then(entities => {
            let length = group.length;
            return group.parse(data, '')
              .then(re => {
                fail('Should not resolve');
                done();
              })
              .catch(() => {
                expect(group.length).toBe(length, 'Wrong amount of entities in group');
                entities.forEach(
                    entity =>
                      expect(group.entities.indexOf(entity) >= 0).toBe(true, `Entity ${entity.id} is not part of the group anymore`)
                );
                done();
              });
          });
      });
    });
  });
});
