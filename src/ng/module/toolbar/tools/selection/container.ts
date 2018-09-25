import { Group, Entity } from "../../../pixi/idx";
import { Graphics } from "pixi.js";
import { SelectionTool } from "../selection";

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

  constructor() {
    super();
    this.on('mousedown', () => { this.handling = true; console.log('here'); } );
    this.on('mouseup', () => this.handling = false);
    this.on('mousemove', event => {
      if (!this.handling) return;
      console.log(event, event.data.originalEvent.which, event.data.originalEvent.isPrimary);
    });
  }

  /**
   * @readonly
   * @type {boolean} Whether user events handled via this container.
   */
  get isHandling(): boolean {
    return this.handling;
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
      entity.emit('selected', this);
    });
    if (this.internalEntities.length > 0) {
      this.interactive = true;
      this.hitArea = this.getLocalBounds();
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
      if (!child.parentEntity) return
      // Restoring the internal relation
      child.parentEntity.addChild(child);
      child.emit('unselected', this);
    });
    this.interactive = false;
    this.emit('unselected', toRemove);
    return toRemove;
  }

}
