import { Group, Entity } from "../../../pixi/idx";
import { Rectangle, Point } from "pixi.js";

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
  protected handling: boolean = false;

  protected handlerRef: any;

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
    if (ref !== this.handlerRef) throw new Error('You are not allowed to call this,' +
                                                  ' since the handling was not started by the given reference');
    this.handlerRef = null;
    this.handling = false;
    const args = Array.prototype.slice.call(arguments);
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
      added.push(entity);
      this.addChild(entity);
      this.toLocal(entity.position, entity.parentEntity, entity.position);
      entity.emit('selected', this);
    });
    if (this.internalEntities.length > 0) {
      this.interactive = true;
      const bounds: Rectangle = this.hitArea = this.getLocalBounds();
      const newPos = this.parent.toLocal(new Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2), this);
      this.position.set(newPos.x, newPos.y);
      this.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
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
    this.handling = false;
    const toRemove = entities.filter(child => this.indexOf(child) >= 0);
    entities.forEach(child => {
      if (toRemove.indexOf(child) < 0) return console.warn('[SelectionContainer] You are trying to remove a child ' +
                                                            'which is not part of this container!');
      this.removeChild(child);
      const idx = this.internalEntities.indexOf(child);
      if (idx >= 0) this.internalEntities.splice(idx, 1);
      if (!child.parentEntity) return;
      // Restoring the internal relation
      child.parentEntity.addChild(child);
      child.parentEntity.toLocal(child.position, this, child.position);
      child.emit('unselected', this);
    });
    if (this.internalEntities.length === 0)
      this.interactive = false;
    this.emit('unselected', toRemove);
    return toRemove;
  }

}
