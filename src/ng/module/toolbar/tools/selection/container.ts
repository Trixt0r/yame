import { Group, Entity } from '../../../pixi/idx';
import { Rectangle, Point, RAD_TO_DEG, DEG_TO_RAD } from 'pixi.js';
import { UpdateSelection } from './ngxs/actions';
import { UpdateEntityProperty, UpdateEntity } from 'ng/module/pixi/ngxs/actions';
import { PropertyOptionsExt, EntityData } from 'ng/module/pixi/scene/entity';
import { Store } from '@ngxs/store';

interface SelectionPropertyOptions extends PropertyOptionsExt {
  apply: (val: number) => void;
  read: (prop: SelectionPropertyOptions) => void;
}

/**
 * The container which should contain the selected entities.
 *
 * Handles selection and unselection of entities.
 * Can be used to isolate entities from a certain container.
 * Provides space for extension of features, such as translating, rotating, scaling, etc.
 *
 * @export
 * @class SelectionContainer
 * @extends {Group<Entity>}
 */
export class SelectionContainer extends Group<Entity> {
  /**
   * @protected
   * @type {boolean} Whether user events are current
   */
  protected handling = false;

  /**
   * @protected
   * @type {*} The current handler reference.
   */
  protected handlerRef: any;

  protected timer: any;

  protected additionalProperties: SelectionPropertyOptions[] = [];
  public readonly additionalPropertyNames: string[];

  constructor(protected store: Store) {
    super();
    this.additionalProperties.push({
      value: this.position.x,
      editable: true,
      export: true,
      name: 'X-Position',
      type: 'number',
      apply: val => this.position.x = val,
      read: prop => prop.value = this.position.x,
    });
    this.additionalProperties.push({
      value: this.position.y,
      editable: true,
      export: true,
      name: 'Y-Position',
      type: 'number',
      apply: val => this.position.y = val,
      read: prop => prop.value = this.position.y,
    });
    this.additionalProperties.push({
      value: this.scale.x,
      transform: 100,
      editable: true,
      export: true,
      name: 'X-Scale',
      type: 'number',
      apply: val => this.entities.length === 1 ? this.entities[0].scale.x = val / 100 : void 0,
      read: prop => this.entities.length === 1 ? prop.value = this.entities[0].scale.x * 100 : void 0,
    });
    this.additionalProperties.push({
      value: this.scale.y,
      transform: 100,
      editable: true,
      export: true,
      name: 'Y-Scale',
      type: 'number',
      apply: val => this.entities.length === 1 ? this.entities[0].scale.y = val / 100 : void 0,
      read: prop => this.entities.length === 1 ? prop.value = this.entities[0].scale.y * 100 : void 0,
    });
    this.additionalProperties.push({
      value: this.rotation,
      editable: true,
      export: true,
      name: 'Rotation',
      type: 'number',
      apply: val => this.rotation = val * DEG_TO_RAD,
      read: prop => prop.value = this.rotation * RAD_TO_DEG,
    });
    this.additionalPropertyNames = this.additionalProperties.map(prop => prop.name);
    this.additionalProperties.reverse();
  }

  /**
   * Begins handling user events with the given reference and arguments.
   * Call this if you are handling events for a specific action which has to be blocked for others.
   *
   * @param ref Your reference, e.g. your instance handling the current user events.
   * @param arg Any additional arguments.
   */
  beginHandling(ref: any, ...arg: any[]): void {
    if (this.handling) throw new Error('beginHandling has already been called. endHandling has to be called before!');
    this.handlerRef = ref;
    this.handling = true;
    const args = Array.prototype.slice.call(arguments, 1);
    args.unshift('handle:start');
    this.emit.apply(this, args);
  }

  /**
   * Ends handling the user events, started with the given reference.
   * An error will be thrown if you call this method with a reference different from the one in beginHandling or if no
   * events are handled at all right now.
   *
   * @param ref The reference, you called beginHandling with.
   * @param arg Any additional arguments.
   */
  endHandling(ref: any, ...arg: any[]) {
    if (!this.handling) throw new Error('beginHandling has to be called before!');
    if (ref !== this.handlerRef)
      throw new Error(
        'You are not allowed to call this,' + ' since the handling was not started by the given reference'
      );
    this.handlerRef = null;
    this.handling = false;
    const args = Array.prototype.slice.call(arguments, 1);
    args.unshift('handle:end');
    this.emit.apply(this, args);
  }

  /**
   * @readonly
   * @type {boolean} Whether user events handled via this container.
   */
  get isHandling(): boolean {
    return this.handling;
  }

  /**
   * @readonly
   * @type {any} The current handler.
   */
  get currentHandler(): any {
    return this.handlerRef;
  }

  /**
   * Selects the given entities, i.e. adds them to this container.
   * This happens without changing the parent entity reference.
   *
   * An already selected entity won't be added to the selection.
   * An entity is considered selected if it is part of this container.
   *
   * Emits the `selected` event with the added entities.
   * Each newly selected entity will also emit the `selected` event with the selection container reference as an arg.
   *
   * @param {Entity[]} entities The entities to add.
   * @return {Entity[]} The added entities.
   */
  select(entities: Entity[]) {
    const added: Entity[] = [];
    entities.forEach(entity => {
      const found = this.indexOf(entity);
      if (found >= 0) return console.warn(`[SelectionContainer] Entity with id ${entity.id} is already selected!`);
      this.internalEntities.push(entity);
      this.addFlatEntity(entity);
      added.push(entity);
      this.addChild(entity);
      this.toLocal(entity.position, entity.parentEntity, entity.position);
      entity.emit('selected', this);
    });
    if (this.internalEntities.length > 0) {
      this.interactive = true;
      const bounds: Rectangle = (this.hitArea = this.getLocalBounds());
      const pivotX = bounds.x + bounds.width / 2;
      const pivotY = bounds.y + bounds.height / 2;
      if (this.parent) {
        const newPos = this.parent.toLocal(new Point(pivotX, pivotY), this);
        this.position.set(newPos.x, newPos.y);
      }
      this.pivot.set(pivotX, pivotY);
    }
    this.emit('selected', added);
    return added;
  }

  /**
   * Unselects the given entities, i.e. removes them from this container.
   * Makes sure to restore each entity to their original parent.
   *
   * Emits the `unselected` event with the added entities.
   * Each unselected entity will also emit the `unselected` event with the selection container reference as an arg.
   *
   * @param {Entity[]} [entities] By default all currently selected entities will be removed.
   * @return {Entity[]}
   */
  unselect(entities: Entity[] = this.entities): Entity[] {
    if (this.handling) this.endHandling(this.currentHandler);
    const toRemove = entities.filter(child => this.indexOf(child) >= 0);
    entities.forEach(child => {
      if (toRemove.indexOf(child) < 0)
        return console.warn(
          '[SelectionContainer] You are trying to remove a child ' + 'which is not part of this container!'
        );
      this.removeChild(child);
      const idx = this.internalEntities.indexOf(child);
      if (idx >= 0) this.internalEntities.splice(idx, 1);
      this.removeFlatEntity(child);
      if (child.parentEntity) {
        // Restoring the internal relation
        child.parentEntity.addChild(child);
        child.parentEntity.toLocal(child.position, this, child.position);
      }
      child.emit('unselected', this);
    });
    if (this.internalEntities.length === 0) this.interactive = false;
    this.emit('unselected', toRemove);
    return toRemove;
  }

  getActualTransform(entity: Entity): Partial<EntityData> {
    if (entity.parentEntity) {
      const position = entity.parentEntity.toLocal(entity.position, this);
      position.x = Math.round(position.x * 1000) / 1000;
      position.y = Math.round(position.y * 1000) / 1000;
      const rotation = DEG_TO_RAD * (Math.round((entity.rotation + this.rotation) * RAD_TO_DEG * 1000) / 1000);
      const scale = new PIXI.Point(entity.scale.x, entity.scale.y);
      scale.x = Math.round(scale.x * 1000) / 1000;
      scale.y = Math.round(scale.y * 1000) / 1000;
      return {
        position: position,
        rotation: rotation,
        scale: scale,
      };
    } else {
      return {
        position: entity.position.clone(),
        rotation: entity.rotation,
        scale: entity.scale.clone(),
      };
    }
  }

  getProperties(entities = this.entities) {
    if (entities.length === 0) return [];
    const props = this.additionalProperties;
    props.forEach(prop => prop.read(prop));
    if (entities.length > 1)
      return props.slice(3).reverse().concat(props[0]);
    const entityProps = entities[0].getProperties();
    props.forEach(prop => entityProps.unshift(prop));
    return entityProps;
  }

  updateFromAction(action: UpdateSelection | UpdateEntityProperty) {
    if (action instanceof UpdateEntityProperty) {
      if (action.id !== 'select') return false;
      for (const attr in action.data) {
        if (!action.data.hasOwnProperty(attr)) continue;
        const property = this.additionalProperties.find(prop => prop.name === attr);
        if (!property) continue;
        property.apply(parseInt(action.data[attr], 10));
        delete action.data[attr];
      }
      if (Object.keys(action.data).length === 0) {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        this.timer = setTimeout(() => {
          const updates = this.map(entity => {
            return Object.assign({ id: entity.id }, this.getActualTransform(entity));
          });
          this.store.dispatch(new UpdateEntity(updates, `Update transform`));
        }, 250);
        this.emit('updated');
        return true;
      }
      if (this.entities.length === 0) return false;
      const updates = this.entities.map(entity => {
        action.id = entity.id;
        const re = entity.updateFromAction(action);
        entity.export('.')
          .then(data => {
            const transform = this.getActualTransform(entity);
            this.store.dispatch(new UpdateEntity(Object.assign(data, transform), `Update ${entity.id}`))
          });
        return re;
      });
      const re = updates.some(val => val);
      if (re) this.emit('updated');
      return re;
    } else {
      const props = action.properties;
      let updated = false;
      props.forEach(prop => {
        const myProp = this.additionalProperties[prop.name];
        if (myProp) {
          myProp.apply(prop.value);
          updated = true;
        }
      });
      if (updated) this.emit('updated');
      return updated;
    }
  }
}
