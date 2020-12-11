import { Injectable } from '@angular/core';
import { SceneEntity } from 'common/scene';
import { EntityTypeServiceException } from '../exceptions/service/entity-type.exception';
import { Store } from '@ngxs/store';
import { CreateEntity } from 'ng/module/scene';
import { Observable } from 'rxjs';

/**
 * Definition for an entity type category.
 */
export interface EntityTypeCategory {
  /**
   * The category id.
   */
  id: string;

  /**
   * Items inside this category.
   */
  items: string[];

  /**
   * The category label.
   */
  label?: string;

  /**
   * An icon for the category.
   */
  icon?: string;

  /**
   * The parent category reference.
   */
  parent?: string;

  /**
   * Further categories inside this category.
   */
  categories?: string[];
}

/**
 * The factory function for creating a new scene component.
 */
export type factoryFn = (entityTypeId: string, parent?: string) => SceneEntity;

/**
 * Definition for an entity type item.
 */
export interface EntityTypeItem {

  /**
   * The global unique id.
   */
  id: string;

  /**
   * The type of the entity, which gets generated.
   */
  type: string;

  /**
   * Factory function, for creating the entity.
   */
  factory: factoryFn;

  /**
   * Label to display. If omitted, the id will be displayed in capitalized form.
   */
  label?: string;

  /**
   * Icon to display in the menu.
   */
  icon?: string;
}

/**
 * The entity type service is responsible for holding a registry of entity types.
 * The service allows to register entity types and categories.
 */
@Injectable({ providedIn: 'root' })
export class EntityTypeService {

  /**
   * Internal array for all entity type items.
   */
  protected entityTypeItems: EntityTypeItem[] = [];

  /**
   * Internal array for all entity type categories.
   */
  protected entityTypeCategories: EntityTypeCategory[] = [];

  /**
   * All registered entity type categories.
   */
  get categories(): EntityTypeCategory[] {
    return this.entityTypeCategories.slice();
  }

  /**
   * All registered entity type items.
   */
  get items(): EntityTypeItem[] {
    return this.entityTypeItems.slice();
  }

  constructor(protected store: Store) { }

  /**
   * Registers the given entity type item in the service, if not registered, yet.
   *
   * @param item The item to register.
   */
  registerItem(item: EntityTypeItem): void {
    const found = this.entityTypeItems.find(it => it.id === item.id);
    if (found) return;
    this.entityTypeItems.push(item);
  }

  /**
   * Registers the given entity type category in the service, if not registered, yet.
   *
   * @param category The category to register.
   */
  registerCategory(category: EntityTypeCategory): void {
    const found = this.entityTypeCategories.find(it => it.id === category.id);
    if (found) return;
    this.entityTypeCategories.push(category);
  }

  /**
   * Returns the scene component item for the given id.
   *
   * @param id The id of the entity type item.
   */
  getItem(id: string): EntityTypeItem | undefined {
    return this.entityTypeItems.find(it => it.id === id);
  }

  /**
   * Returns all categories for the given item.
   *
   * @param itemOrId The item to search for.
   * @return A list of all categories associated with the given entity type item.
   */
  getCategories(itemOrId: string | EntityTypeItem): EntityTypeCategory[] {
    const item = typeof itemOrId === 'string' ? this.getItem(itemOrId) : itemOrId;
    if (!item) return [];
    const id = item.id;
    return this.entityTypeCategories.filter(category => category.items.indexOf(id) >= 0);
  }

  /**
   * Returns all types for the given categories.
   *
   * @param category
   * @return A list of all entity type item ids associated with the given category.
   */
  getItems(category: string | EntityTypeCategory): string[] {
    const typeCategory = typeof category === 'string' ? this.entityTypeCategories.find(it => it.id === category) : category;
    if (!typeCategory) return [];
    return typeCategory.items.slice();
  }

  /**
   * Adds an entity for the given item id to the scene.
   *
   * @param itemId The item id.
   * @param [parent] The parent id.
   * @return An observable stream you can subscribe to.
   */
  addEntity(itemId: string, parent?: string): Observable<any> {
    const item = this.getItem(itemId);
    if (!item) throw new EntityTypeServiceException(`Could not find definition for id ${itemId}`);
    if (typeof item.factory !== 'function') throw new EntityTypeServiceException(`No factory method defined for id ${itemId}`);
    const entity = item.factory(item.id, parent);
    if (parent) entity.parent = parent;
    return this.store.dispatch(new CreateEntity(entity));
  }

}
